import { MigrationInterface, QueryRunner } from 'typeorm';

/** The tables and indexes of the entities, in creation order. */
const INITIAL_SCHEMA = [
  `CREATE TABLE "sys_configuration" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(255) NOT NULL, "value" varchar(1000) NOT NULL, "description" text, CONSTRAINT "UQ_dc86768630d34be00e3ade9d74a" UNIQUE ("name"))`,
  `CREATE TABLE "authentication_setting" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar(255), "password" varchar(255), "project_id" integer, CONSTRAINT "REL_cf06be6f42cf869de57b4348c2" UNIQUE ("project_id"), CONSTRAINT "FK_cf06be6f42cf869de57b4348c2c" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE TABLE "browser_setting" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "browser" json, "headless" boolean NOT NULL DEFAULT (0), "project_id" integer, CONSTRAINT "REL_7f1c2ad43d6be1f5d52a5d5016" UNIQUE ("project_id"), CONSTRAINT "FK_7f1c2ad43d6be1f5d52a5d5016d" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE TABLE "application_setting" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "local_storage_config" json NOT NULL, "cookie_config" json, "gtm_config" json, "website_url" varchar(255), "project_id" integer, CONSTRAINT "REL_c59c1938d38ab00f1ed3f6705f" UNIQUE ("project_id"), CONSTRAINT "FK_c59c1938d38ab00f1ed3f6705f0" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE TABLE "project" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "project_slug" varchar(255) NOT NULL, "project_name" varchar(255) NOT NULL, "project_description" text, "measurement_id" varchar(100), "gtm_configuration_path" varchar(1024), CONSTRAINT "UQ_0bbcd4cfa176155a212f77ef647" UNIQUE ("project_slug"))`,
  `CREATE UNIQUE INDEX "IDX_0bbcd4cfa176155a212f77ef64" ON "project" ("project_slug")`,
  `CREATE TABLE "test_event_detail" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "passed" boolean NOT NULL, "request_passed" boolean NOT NULL, "raw_request" text, "destination_url" varchar NOT NULL, "data_layer" json, "message" text, "testEventId" integer, "test_image_id" integer, CONSTRAINT "REL_9ff655cd1d124e21ba853b3f06" UNIQUE ("test_image_id"), CONSTRAINT "FK_d87520d465101c64bdf75858496" FOREIGN KEY ("testEventId") REFERENCES "test_event" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_9ff655cd1d124e21ba853b3f061" FOREIGN KEY ("test_image_id") REFERENCES "test_image" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
  `CREATE INDEX "IDX_d87520d465101c64bdf7585849" ON "test_event_detail" ("testEventId")`,
  `CREATE TABLE "spec" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "event_name" varchar(255) NOT NULL, "data_layer_spec" json, "raw_gtm_tag" json, "test_event_id" integer, CONSTRAINT "REL_22b0f2c4f56ed05b2073b8ede7" UNIQUE ("test_event_id"), CONSTRAINT "FK_22b0f2c4f56ed05b2073b8ede76" FOREIGN KEY ("test_event_id") REFERENCES "test_event" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE TABLE "recording" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar(255) NOT NULL, "steps" json NOT NULL, "test_event_id" integer, CONSTRAINT "REL_c0d1853919ab508829fabc56d7" UNIQUE ("test_event_id"), CONSTRAINT "FK_c0d1853919ab508829fabc56d78" FOREIGN KEY ("test_event_id") REFERENCES "test_event" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE TABLE "item_def" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "template_name" varchar(255) NOT NULL, "item_id" varchar, "full_item_def" json, "test_event_id" integer, CONSTRAINT "REL_c8750c796f8572fd4b798daad9" UNIQUE ("test_event_id"), CONSTRAINT "FK_c8750c796f8572fd4b798daad9a" FOREIGN KEY ("test_event_id") REFERENCES "test_event" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE TABLE "test_event" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "event_id" varchar NOT NULL, "test_name" varchar NOT NULL, "event_name" varchar NOT NULL, "stop_navigation" boolean, "message" text, "latest_test_event_detail_id" integer, "latest_test_image_id" integer, "project_id" integer, CONSTRAINT "REL_b2a2b52dbe1a88395384da8928" UNIQUE ("latest_test_event_detail_id"), CONSTRAINT "REL_0725cde26cc4f4141d103547c9" UNIQUE ("latest_test_image_id"), CONSTRAINT "FK_90e5e2a6c8a8c1adbae7ab7cc4e" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_b2a2b52dbe1a88395384da89281" FOREIGN KEY ("latest_test_event_detail_id") REFERENCES "test_event_detail" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_0725cde26cc4f4141d103547c97" FOREIGN KEY ("latest_test_image_id") REFERENCES "test_image" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
  `CREATE UNIQUE INDEX "IDX_8769e4b2179cc8b146dc2c1654" ON "test_event" ("project_id", "event_id")`,
  `CREATE TABLE "test_image" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "image_name" varchar NOT NULL, "image_data" blob NOT NULL, "image_size" integer, "testEventId" integer, CONSTRAINT "FK_c74b66ba88ec96e210721bf8589" FOREIGN KEY ("testEventId") REFERENCES "test_event" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE INDEX "IDX_c74b66ba88ec96e210721bf858" ON "test_image" ("testEventId")`
];

/**
 * The schema of the entities when TagCheck moved from `synchronize` to
 * migrations. Every later schema change is a migration of its own.
 */
export class InitialSchema1792540800000 implements MigrationInterface {
  name = 'InitialSchema1792540800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Sequential on purpose: one connection, and an index needs its table.
    for (const statement of INITIAL_SCHEMA) {
      await queryRunner.query(statement);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // test_event and its latest run and screenshot reference each other, and
    // SQLite cannot drop a table whose foreign key names a dropped table.
    // Rebuild test_event without those two keys, then drop children first.
    await queryRunner.query(
      `CREATE TABLE "temporary_test_event" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "event_id" varchar NOT NULL, "test_name" varchar NOT NULL, "event_name" varchar NOT NULL, "stop_navigation" boolean, "message" text, "latest_test_event_detail_id" integer, "latest_test_image_id" integer, "project_id" integer, CONSTRAINT "FK_90e5e2a6c8a8c1adbae7ab7cc4e" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_test_event" SELECT * FROM "test_event"`
    );
    await queryRunner.query(`DROP TABLE "test_event"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_test_event" RENAME TO "test_event"`
    );
    for (const table of [
      'item_def',
      'recording',
      'spec',
      'test_event_detail',
      'test_image',
      'test_event',
      'application_setting',
      'browser_setting',
      'authentication_setting',
      'project',
      'sys_configuration'
    ]) {
      // Sequential on purpose: a child table goes before its parent.
      await queryRunner.query(`DROP TABLE "${table}"`);
    }
  }
}
