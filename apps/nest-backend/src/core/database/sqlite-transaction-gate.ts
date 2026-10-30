import { AsyncLocalStorage } from 'node:async_hooks';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';

/** How long a transaction waits for a `save()` that opened its own. */
export const IMPLICIT_TRANSACTION_TIMEOUT_MS = 30_000;
const IMPLICIT_TRANSACTION_POLL_MS = 5;

const gates = new WeakMap<DataSource, SqliteTransactionGate>();

/**
 * Runs SQLite transactions one at a time.
 *
 * TypeORM's SQLite driver has one connection and hands every caller the
 * same query runner, so overlapping transactions share it: the second
 * becomes a savepoint of the first, the first "commits" by releasing that
 * savepoint, and a rollback of either undoes both. A query made outside a
 * transaction while one is open joins it and is rolled back with it.
 *
 * The gate queues transactions and holds queries made outside the open
 * transaction until it ends; a `save()` made outside it opens its own
 * transaction afterwards. A transaction starts only once a `save()` that
 * opened its own transaction has finished. Work inside a transaction,
 * including a nested transaction, passes straight through, so a transaction
 * body must not wait for work started outside it that queries the database.
 */
class SqliteTransactionGate {
  /** Marks the async work that belongs to the open transaction. */
  private readonly owner = new AsyncLocalStorage<symbol>();
  private holder: symbol | null = null;
  /** Resolves when the open transaction ends. */
  private closed: Promise<void> = Promise.resolve();
  /** Resolves when the last queued transaction ends. */
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly runner: QueryRunner) {}

  async exclusive<T>(work: () => Promise<T>): Promise<T> {
    if (this.isHolder()) return work();
    const previous = this.queue;
    let leave: () => void = () => undefined;
    this.queue = new Promise<void>((resolve) => {
      leave = resolve;
    });
    try {
      await previous;
      await this.untilNoImplicitTransaction();
      // From here to work's first await runs synchronously, so nothing can
      // open a transaction in between.
      const token = Symbol('sqlite-transaction');
      let open: () => void = () => undefined;
      this.closed = new Promise<void>((resolve) => {
        open = resolve;
      });
      this.holder = token;
      try {
        return await this.owner.run(token, work);
      } finally {
        this.holder = null;
        open();
      }
    } finally {
      leave();
    }
  }

  /** Runs work once no transaction but the caller's own is open. */
  async whenFree<T>(run: () => Promise<T>): Promise<T> {
    while (this.excludesCaller()) await this.closed;
    return run();
  }

  /** Whether a transaction the caller is not part of is open. */
  excludesCaller(): boolean {
    return this.holder !== null && !this.isHolder();
  }

  private isHolder(): boolean {
    return this.holder !== null && this.owner.getStore() === this.holder;
  }

  /**
   * Waits for a transaction that `save()` opened by itself. A failed
   * ROLLBACK leaves TypeORM's flag set, so the wait is bounded.
   */
  private async untilNoImplicitTransaction(): Promise<void> {
    const deadline = Date.now() + IMPLICIT_TRANSACTION_TIMEOUT_MS;
    while (this.runner.isTransactionActive) {
      if (Date.now() >= deadline) {
        throw new Error(
          'The database is still in a transaction that did not end'
        );
      }
      await new Promise<void>((resolve) =>
        setTimeout(resolve, IMPLICIT_TRANSACTION_POLL_MS)
      );
    }
  }
}

/**
 * Puts the data source's transactions and queries through one gate. Only a
 * driver that hands every caller the same query runner (SQLite) needs it;
 * for any other driver this does nothing. Install it once, after migrating.
 */
export function serializeSqliteTransactions(dataSource: DataSource): void {
  const runner = dataSource.createQueryRunner();
  if (gates.has(dataSource) || runner !== dataSource.createQueryRunner()) {
    return;
  }
  const gate = new SqliteTransactionGate(runner);
  gates.set(dataSource, gate);

  const query = runner.query.bind(runner) as (
    ...args: unknown[]
  ) => Promise<unknown>;
  runner.query = ((...args: unknown[]) =>
    gate.whenFree(() => query(...args))) as QueryRunner['query'];

  // save() and the query builders open their own transaction only when the
  // runner shows none. Outside the open transaction they see none, so they
  // open their own once it ends instead of joining it.
  let active = runner.isTransactionActive;
  Object.defineProperty(runner, 'isTransactionActive', {
    configurable: true,
    enumerable: true,
    get: () => !gate.excludesCaller() && active,
    set: (value: boolean) => {
      active = value;
    }
  });
  const startTransaction = runner.startTransaction.bind(runner) as (
    ...args: unknown[]
  ) => Promise<void>;
  runner.startTransaction = ((...args: unknown[]) =>
    gate.whenFree(() =>
      startTransaction(...args)
    )) as QueryRunner['startTransaction'];

  const manager = dataSource.manager;
  const transaction = manager.transaction.bind(manager) as (
    ...args: unknown[]
  ) => Promise<unknown>;
  manager.transaction = ((...args: unknown[]) =>
    gate.exclusive(() => transaction(...args))) as EntityManager['transaction'];
}

/**
 * Runs work that manages its own transaction on the data source's query
 * runner, such as `startTransaction` and `commitTransaction`, through the
 * gate. Without a gate it runs the work as it is.
 */
export async function runExclusively<T>(
  dataSource: DataSource,
  work: () => Promise<T>
): Promise<T> {
  const gate = gates.get(dataSource);
  return gate ? gate.exclusive(work) : work();
}
