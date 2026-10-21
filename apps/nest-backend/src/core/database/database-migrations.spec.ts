import { DataSource } from 'typeorm';
import { afterEach, describe, expect, it } from 'vitest';
import { DATABASE_ENTITIES } from './database-entities';
import { DATABASE_MIGRATIONS, migrateDatabase } from './database-migrations';
import { SCHEMA_3_0_0 } from './schema-3.0.0.fixture';

let dataSource: DataSource | undefined;

async function openDatabase() {
  dataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: DATABASE_ENTITIES,
    migrations: DATABASE_MIGRATIONS
  });
  return await dataSource.initialize();
}

/** The SQL `synchronize` would still run: none when the schema matches the entities. */
async function pendingSchemaChanges(database: DataSource) {
  const sql = await database.driver.createSchemaBuilder().log();
  return sql.upQueries.map((query) => query.query);
}

async function appliedMigrations(database: DataSource) {
  const rows: { name: string }[] = await database.query(
    'SELECT name FROM migrations ORDER BY id'
  );
  return rows.map((row) => row.name);
}

afterEach(async () => {
  await dataSource?.destroy();
  dataSource = undefined;
});

describe('migrateDatabase', () => {
  it('builds the schema the entities describe in a new database', async () => {
    const database = await openDatabase();

    await migrateDatabase(database);

    // An entity change without a migration fails here.
    expect(await pendingSchemaChanges(database)).toEqual([]);
    expect(await appliedMigrations(database)).toEqual(
      DATABASE_MIGRATIONS.map((migration) => migration.name)
    );
  });

  it('upgrades a 3.0.0 database created by synchronize and keeps its rows', async () => {
    const database = await openDatabase();
    for (const statement of SCHEMA_3_0_0) {
      await database.query(statement);
    }
    await database.query(
      `INSERT INTO "project" ("id", "project_slug", "project_name") VALUES (1, 'shop', 'Shop')`
    );
    await database.query(
      `INSERT INTO "test_event" ("id", "event_id", "test_name", "event_name", "message", "project_id") VALUES (1, 'evt', 'GA4 event - add_to_cart', 'add_to_cart', 'Valid', 1)`
    );
    await database.query(
      `INSERT INTO "test_event_detail" ("id", "passed", "request_passed", "destination_url", "testEventId") VALUES (1, 1, 1, 'https://shop.example/cart', 1)`
    );

    await migrateDatabase(database);

    expect(await pendingSchemaChanges(database)).toEqual([]);
    expect(await appliedMigrations(database)).toEqual(
      DATABASE_MIGRATIONS.map((migration) => migration.name)
    );
    expect(
      await database.query(
        'SELECT "event_name", "message" FROM "test_event" WHERE "id" = 1'
      )
    ).toEqual([{ event_name: 'add_to_cart', message: 'Valid' }]);
    expect(
      await database.query(
        'SELECT "destination_url", "message", "test_image_id" FROM "test_event_detail" WHERE "id" = 1'
      )
    ).toEqual([
      {
        destination_url: 'https://shop.example/cart',
        message: null,
        test_image_id: null
      }
    ]);
  });

  it('runs nothing when the database is up to date', async () => {
    const database = await openDatabase();
    await migrateDatabase(database);

    await migrateDatabase(database);

    expect(await appliedMigrations(database)).toHaveLength(
      DATABASE_MIGRATIONS.length
    );
    expect(await pendingSchemaChanges(database)).toEqual([]);
  });
});
