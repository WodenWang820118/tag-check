import { MigrationInterface, QueryRunner } from 'typeorm';

/** The tables of batches, their items and schedules, in creation order. */
const BATCH_RUN_SCHEMA = [
  `CREATE TABLE "schedule" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(255) NOT NULL, "event_ids" json NOT NULL, "kind" varchar(20) NOT NULL, "time" varchar(5), "weekdays" json, "every_hours" integer, "enabled" boolean NOT NULL DEFAULT (1), "last_run_at" datetime, "next_run_at" datetime, "project_id" integer NOT NULL, CONSTRAINT "FK_bfa93d2d7be94a51a8af9212e2e" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
  `CREATE INDEX "IDX_bfa93d2d7be94a51a8af9212e2" ON "schedule" ("project_id")`,
  `CREATE TABLE "batch_run" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "source" varchar(20) NOT NULL, "schedule_id" integer, "headless" boolean NOT NULL, "status" varchar(20) NOT NULL, "started_at" datetime, "finished_at" datetime, "project_id" integer NOT NULL, CONSTRAINT "FK_4fa429235402347b73f52f9ab96" FOREIGN KEY ("project_id") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_77f8c38328ad61921ebf46b3c7c" FOREIGN KEY ("schedule_id") REFERENCES "schedule" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
  `CREATE INDEX "IDX_4fa429235402347b73f52f9ab9" ON "batch_run" ("project_id")`,
  `CREATE INDEX "IDX_fb9dd314e1d9a6f4ae00c80231" ON "batch_run" ("status")`,
  `CREATE TABLE "batch_run_item" ("createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "position" integer NOT NULL, "status" varchar(20) NOT NULL, "message" text, "started_at" datetime, "finished_at" datetime, "test_event_detail_id" integer, "batch_run_id" integer NOT NULL, "test_event_id" integer NOT NULL, CONSTRAINT "FK_2a3ef6fb04dcca72dbc19996763" FOREIGN KEY ("batch_run_id") REFERENCES "batch_run" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_a367272c30c513884a11f1a412b" FOREIGN KEY ("test_event_id") REFERENCES "test_event" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_132c2c8b61ba134a017686e1e63" FOREIGN KEY ("test_event_detail_id") REFERENCES "test_event_detail" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
  `CREATE INDEX "IDX_2a3ef6fb04dcca72dbc1999676" ON "batch_run_item" ("batch_run_id")`,
  `CREATE INDEX "IDX_a367272c30c513884a11f1a412" ON "batch_run_item" ("test_event_id")`,
  `CREATE INDEX "IDX_e0175f920e1ac0a7da2b0f87ba" ON "batch_run_item" ("status")`
];

/**
 * Batches the backend runs one test at a time (`batch_run`,
 * `batch_run_item`) and the schedules that start them (`schedule`).
 */
export class BatchRunsAndSchedules1792886400000 implements MigrationInterface {
  name = 'BatchRunsAndSchedules1792886400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Sequential on purpose: one connection, and an index needs its table.
    for (const statement of BATCH_RUN_SCHEMA) {
      await queryRunner.query(statement);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Children first; dropping a table drops its indexes.
    for (const table of ['batch_run_item', 'batch_run', 'schedule']) {
      await queryRunner.query(`DROP TABLE "${table}"`);
    }
  }
}
