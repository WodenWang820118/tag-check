import { DataSource } from 'typeorm';
import { InitialSchema1792540800000 } from './migrations/1792540800000-initial-schema';

/** Every migration, oldest first. Add a migration for each schema change. */
export const DATABASE_MIGRATIONS = [InitialSchema1792540800000];

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
