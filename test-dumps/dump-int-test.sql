-- === BEGIN SCHEMA ===
PRAGMA foreign_keys = OFF;
CREATE TABLE IF NOT EXISTS "project" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "project_slug" varchar NOT NULL, "project_name" varchar NOT NULL, CONSTRAINT "UQ_0bbcd4cfa176155a212f77ef647" UNIQUE ("project_slug"));
CREATE TABLE IF NOT EXISTS "test_event" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "project_id" integer NOT NULL, "event_id" varchar NOT NULL, "test_name" varchar NOT NULL, "event_name" varchar NOT NULL, "message" text, CONSTRAINT "UQ_ec88dbfca8cba0bea85aa7cbc3e" UNIQUE ("event_id"), CONSTRAINT "FK_90e5e2a6c8a8c1adbae7ab7cc4e" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION);
PRAGMA foreign_keys = ON;
-- === END SCHEMA ===

-- === BEGIN DATA ===
PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;
-- Data for entity: ProjectEntity (table: project)
INSERT INTO "project" ("id", "project_slug", "project_name") VALUES (1, 'slug-a', 'Name A');

-- Data for entity: TestEventEntity (table: test_event)
INSERT INTO "test_event" ("id", "project_id", "event_id", "test_name", "event_name", "message") VALUES (1, 1, 'E1', 'Test 1', 'Evt', 'Hello');

COMMIT;
PRAGMA foreign_keys = ON;
-- === END DATA ===

