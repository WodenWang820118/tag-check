import { MigrationInterface, QueryRunner } from 'typeorm';

/** The columns this migration adds to `test_event_detail`, in order. */
const RUN_MEDIA_COLUMNS = [
  `"request_message" text`,
  `"recording_key" varchar(36)`,
  `"media_timeline" json`
];

/**
 * Each run keeps its own screen recordings and the GA4 request check's
 * message (`test_event_detail.request_message`, `recording_key`,
 * `media_timeline`). New nullable columns, added in place: rebuilding the
 * table would also touch the rows that reference it.
 */
export class RunMedia1793059200000 implements MigrationInterface {
  name = 'RunMedia1793059200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const column of RUN_MEDIA_COLUMNS) {
      await queryRunner.query(
        `ALTER TABLE "test_event_detail" ADD COLUMN ${column}`
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const column of [...RUN_MEDIA_COLUMNS].reverse()) {
      const name = column.split(' ')[0];
      await queryRunner.query(
        `ALTER TABLE "test_event_detail" DROP COLUMN ${name}`
      );
    }
  }
}
