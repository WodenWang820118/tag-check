import { DataSource, DataSourceOptions } from 'typeorm';
import { InitialSchema1792540800000 } from './migrations/1792540800000-initial-schema';
import { BatchRunsAndSchedules1792886400000 } from './migrations/1792886400000-batch-runs-and-schedules';
import { RunMedia1793059200000 } from './migrations/1793059200000-run-media';
import { RunRequestChecked1793318400000 } from './migrations/1793318400000-run-request-checked';
import { serializeSqliteTransactions } from './sqlite-transaction-gate';

/** Every migration, oldest first. Add a migration for each schema change. */
export const DATABASE_MIGRATIONS = [
  InitialSchema1792540800000,
  BatchRunsAndSchedules1792886400000,
  RunMedia1793059200000,
  RunRequestChecked1793318400000
];

const MIGRATIONS_TABLE = 'migrations';

/**
 * Brings the database to the schema the entities describe.
 *
 * Before migrations, TagCheck created and updated its tables with
 * `synchronize`. Such a database has tables but no migrations table: it is
 * synchronized one last time, and every migration is recorded as applied
 * without running, since synchronizing already produced their schema. From
 * then on, and for a new database, only pending migrations run.
 */
export async function migrateDatabase(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  let createdBySynchronize: boolean;
  try {
    createdBySynchronize =
      !(await queryRunner.hasTable(MIGRATIONS_TABLE)) &&
      (await queryRunner.hasTable('project'));
  } finally {
    await queryRunner.release();
  }

  if (createdBySynchronize) {
    await dataSource.synchronize();
    await dataSource.runMigrations({ fake: true });
  }
  await dataSource.runMigrations({ transaction: 'each' });
}

/**
 * Opens the database and migrates it, for TypeOrmModule's
 * dataSourceFactory: no module queries the database before it is migrated.
 * Its transactions then run one at a time (`serializeSqliteTransactions`).
 *
 * @throws When the options are missing or a migration fails. The connection
 * is closed first: TypeOrmModule retries the factory, and every attempt
 * would otherwise leave the SQLite file open (and locked, on Windows).
 */
export async function createMigratedDataSource(
  options?: DataSourceOptions
): Promise<DataSource> {
  if (!options) {
    throw new Error('TypeORM options are missing');
  }
  const dataSource = await new DataSource(options).initialize();
  try {
    await migrateDatabase(dataSource);
  } catch (error) {
    await dataSource.destroy();
    throw error;
  }
  serializeSqliteTransactions(dataSource);
  return dataSource;
}
