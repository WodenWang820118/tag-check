import { DataSource, InsertEvent } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectEntity } from '../../shared/entity/project.entity';
import { DATABASE_ENTITIES } from './database-entities';
import {
  createMigratedDataSource,
  DATABASE_MIGRATIONS
} from './database-migrations';
import {
  IMPLICIT_TRANSACTION_TIMEOUT_MS,
  runExclusively,
  serializeSqliteTransactions
} from './sqlite-transaction-gate';

function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve: () => resolve() };
}

const pause = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Transactions on SQLite's single shared query runner, through the gate. */
describe('serializeSqliteTransactions (SQLite, migrated)', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = await createMigratedDataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: DATABASE_ENTITIES,
      migrations: DATABASE_MIGRATIONS
    });
  });

  afterEach(async () => {
    vi.useRealTimers();
    await dataSource.destroy();
  });

  const project = (projectSlug: string) => ({
    projectSlug,
    projectName: projectSlug
  });

  async function slugs(): Promise<string[]> {
    const rows = await dataSource
      .getRepository(ProjectEntity)
      .find({ order: { projectSlug: 'ASC' } });
    return rows.map((row) => row.projectSlug);
  }

  it('keeps a committed transaction when an overlapping one rolls back', async () => {
    const order: string[] = [];
    const first = dataSource.transaction(async (manager) => {
      order.push('first starts');
      await manager.save(ProjectEntity, project('first'));
      // Without the gate, the second transaction opens here as a savepoint
      // of this one, and its rollback would undo this commit.
      await pause(20);
      order.push('first ends');
    });
    const second = dataSource.transaction(async (manager) => {
      order.push('second starts');
      await manager.save(ProjectEntity, project('second'));
      await first;
      throw new Error('second fails');
    });

    await first;
    await expect(second).rejects.toThrow('second fails');
    expect(order).toEqual(['first starts', 'first ends', 'second starts']);
    expect(await slugs()).toEqual(['first']);
  });

  it('keeps a save made outside an open transaction out of its rollback', async () => {
    const entered = deferred();
    const release = deferred();
    const failing = dataSource.transaction(async (manager) => {
      await manager.save(ProjectEntity, project('inside'));
      entered.resolve();
      await release.promise;
      throw new Error('rolled back');
    });

    await entered.promise;
    const outside = dataSource
      .getRepository(ProjectEntity)
      .save(project('outside'));
    // Without the gate, the save's INSERT runs inside the open transaction.
    await pause(20);
    release.resolve();

    await expect(failing).rejects.toThrow('rolled back');
    await outside;
    expect(await slugs()).toEqual(['outside']);
  });

  it('gives a save made during an open transaction a transaction of its own', async () => {
    await dataSource.getRepository(ProjectEntity).save(project('taken'));
    const entered = deferred();
    const release = deferred();
    const open = dataSource.transaction(async (manager) => {
      await manager.save(ProjectEntity, project('inside'));
      entered.resolve();
      await release.promise;
    });

    await entered.promise;
    // The second row breaks the unique slug, so the whole save rolls back.
    const outside = dataSource
      .getRepository(ProjectEntity)
      .save([project('partial'), project('taken')]);
    await pause(20);
    release.resolve();

    await open;
    await expect(outside).rejects.toThrow(/UNIQUE/);
    expect(await slugs()).toEqual(['inside', 'taken']);
  });

  it('lets a transaction open a nested one without waiting for itself', async () => {
    await dataSource.transaction(async (manager) => {
      await manager.save(ProjectEntity, project('outer'));
      await dataSource.transaction((inner) =>
        inner.save(ProjectEntity, project('inner'))
      );
      await manager.save(ProjectEntity, project('after inner'));
    });

    expect(await slugs()).toEqual(['after inner', 'inner', 'outer']);
  });

  it('starts a transaction only after a save that opened its own has ended', async () => {
    const inserting = deferred();
    const hold = deferred();
    dataSource.subscribers.push({
      beforeInsert: async (event: InsertEvent<ProjectEntity>) => {
        if (event.entity.projectSlug !== 'slow') return;
        inserting.resolve();
        await hold.promise;
      }
    });
    const order: string[] = [];

    const slow = dataSource.getRepository(ProjectEntity).save(project('slow'));
    await inserting.promise;
    expect(dataSource.createQueryRunner().isTransactionActive).toBe(true);
    const transaction = dataSource.transaction(async (manager) => {
      order.push('transaction');
      await manager.save(ProjectEntity, project('after'));
    });
    await pause(20);
    order.push('save released');
    hold.resolve();

    await slow;
    await transaction;
    expect(order).toEqual(['save released', 'transaction']);
    expect(await slugs()).toEqual(['after', 'slow']);
  });

  it('gives up on a transaction that never ends', async () => {
    const runner = dataSource.createQueryRunner();
    vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] });
    // As after a ROLLBACK that failed: TypeORM's flag stays set.
    Reflect.set(runner, 'isTransactionActive', true);
    try {
      const blocked = expect(
        dataSource.transaction(async () => undefined)
      ).rejects.toThrow('did not end');
      await vi.advanceTimersByTimeAsync(IMPLICIT_TRANSACTION_TIMEOUT_MS + 10);
      await blocked;
    } finally {
      Reflect.set(runner, 'isTransactionActive', false);
    }
  });

  it('installs the gate once', () => {
    const transaction = dataSource.manager.transaction;
    serializeSqliteTransactions(dataSource);
    expect(dataSource.manager.transaction).toBe(transaction);
  });
});

describe('serializeSqliteTransactions (a query runner per caller)', () => {
  it('leaves the data source as it is and runs exclusive work directly', async () => {
    const manager = { transaction: vi.fn() };
    const dataSource = {
      manager,
      createQueryRunner: () => ({})
    } as unknown as DataSource;

    serializeSqliteTransactions(dataSource);

    expect(dataSource.manager.transaction).toBe(manager.transaction);
    await expect(runExclusively(dataSource, async () => 'done')).resolves.toBe(
      'done'
    );
  });
});
