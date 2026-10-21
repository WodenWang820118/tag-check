import { DataSource } from 'typeorm';
import { afterEach, describe, expect, it } from 'vitest';
import { DATABASE_ENTITIES } from './database-entities';
import {
  createMigratedDataSource,
  DATABASE_MIGRATIONS,
  migrateDatabase
} from './database-migrations';

/**
 * The schema TagCheck 3.0.0 left with `synchronize`, read from a database it
 * created.
 */
const SCHEMA_3_0_0 = [
  `CREATE TABLE "application_setting" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "local_storage_config" json NOT NULL, "cookie_config" json, "gtm_config" json, "website_url" varchar(255), "project_id" integer, CONSTRAINT "REL_c59c1938d38ab00f1ed3f6705f" UNIQUE ("project_id"), CONSTRAINT "FK_c59c1938d38ab00f1ed3f6705f0" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE TABLE "authentication_setting" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar(255), "password" varchar(255), "project_id" integer, CONSTRAINT "REL_cf06be6f42cf869de57b4348c2" UNIQUE ("project_id"), CONSTRAINT "FK_cf06be6f42cf869de57b4348c2c" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE TABLE "browser_setting" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "browser" json, "headless" boolean NOT NULL DEFAULT (0), "project_id" integer, CONSTRAINT "REL_7f1c2ad43d6be1f5d52a5d5016" UNIQUE ("project_id"), CONSTRAINT "FK_7f1c2ad43d6be1f5d52a5d5016d" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE TABLE "item_def" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "template_name" varchar(255) NOT NULL, "item_id" varchar, "full_item_def" json, "test_event_id" integer, CONSTRAINT "REL_c8750c796f8572fd4b798daad9" UNIQUE ("test_event_id"), CONSTRAINT "FK_c8750c796f8572fd4b798daad9a" FOREIGN KEY ("test_event_id") REFERENCES "test_event" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE TABLE "project" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "project_slug" varchar(255) NOT NULL, "project_name" varchar(255) NOT NULL, "project_description" text, "measurement_id" varchar(100), "gtm_configuration_path" varchar(1024), CONSTRAINT "UQ_0bbcd4cfa176155a212f77ef647" UNIQUE ("project_slug"))`,
  `CREATE TABLE "recording" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar(255) NOT NULL, "steps" json NOT NULL, "test_event_id" integer, CONSTRAINT "REL_c0d1853919ab508829fabc56d7" UNIQUE ("test_event_id"), CONSTRAINT "FK_c0d1853919ab508829fabc56d78" FOREIGN KEY ("test_event_id") REFERENCES "test_event" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE TABLE "spec" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "event_name" varchar(255) NOT NULL, "data_layer_spec" json, "raw_gtm_tag" json, "test_event_id" integer, CONSTRAINT "REL_22b0f2c4f56ed05b2073b8ede7" UNIQUE ("test_event_id"), CONSTRAINT "FK_22b0f2c4f56ed05b2073b8ede76" FOREIGN KEY ("test_event_id") REFERENCES "test_event" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE TABLE "sys_configuration" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(255) NOT NULL, "value" varchar(1000) NOT NULL, "description" text, CONSTRAINT "UQ_dc86768630d34be00e3ade9d74a" UNIQUE ("name"))`,
  `CREATE TABLE "test_event" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "event_id" varchar NOT NULL, "test_name" varchar NOT NULL, "event_name" varchar NOT NULL, "stop_navigation" boolean, "message" text, "latest_test_event_detail_id" integer, "latest_test_image_id" integer, "project_id" integer, CONSTRAINT "REL_b2a2b52dbe1a88395384da8928" UNIQUE ("latest_test_event_detail_id"), CONSTRAINT "REL_0725cde26cc4f4141d103547c9" UNIQUE ("latest_test_image_id"), CONSTRAINT "FK_90e5e2a6c8a8c1adbae7ab7cc4e" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_b2a2b52dbe1a88395384da89281" FOREIGN KEY ("latest_test_event_detail_id") REFERENCES "test_event_detail" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_0725cde26cc4f4141d103547c97" FOREIGN KEY ("latest_test_image_id") REFERENCES "test_image" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
  `CREATE TABLE "test_event_detail" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "passed" boolean NOT NULL, "request_passed" boolean NOT NULL, "raw_request" text, "destination_url" varchar NOT NULL, "data_layer" json, "testEventId" integer, CONSTRAINT "FK_d87520d465101c64bdf75858496" FOREIGN KEY ("testEventId") REFERENCES "test_event" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE TABLE "test_image" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "image_name" varchar NOT NULL, "image_data" blob NOT NULL, "image_size" integer, "testEventId" integer, CONSTRAINT "FK_c74b66ba88ec96e210721bf8589" FOREIGN KEY ("testEventId") REFERENCES "test_event" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE UNIQUE INDEX "IDX_0bbcd4cfa176155a212f77ef64" ON "project" ("project_slug")`,
  `CREATE UNIQUE INDEX "IDX_8769e4b2179cc8b146dc2c1654" ON "test_event" ("project_id", "event_id")`
];

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
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
  dataSource = undefined;
});

describe('createMigratedDataSource', () => {
  it('opens and migrates the database', async () => {
    dataSource = await createMigratedDataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: DATABASE_ENTITIES,
      migrations: DATABASE_MIGRATIONS
    });

    expect(dataSource.isInitialized).toBe(true);
    expect(await appliedMigrations(dataSource)).toHaveLength(
      DATABASE_MIGRATIONS.length
    );
  });

  it('needs the TypeORM options', async () => {
    await expect(createMigratedDataSource()).rejects.toThrow(
      'TypeORM options are missing'
    );
  });
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

  it('undoes the initial schema', async () => {
    const database = await openDatabase();
    await migrateDatabase(database);

    await database.undoLastMigration();

    expect(await appliedMigrations(database)).toEqual([]);
    expect(
      await database.query(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT IN ('migrations', 'sqlite_sequence')"
      )
    ).toEqual([]);
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
