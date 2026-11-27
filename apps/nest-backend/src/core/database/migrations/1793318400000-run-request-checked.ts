import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Records whether each run made the GA4 request check
 * (`test_event_detail.request_checked`). Earlier runs cannot say, so they
 * read as checked: their status stays as it was. Added in place, like
 * RunMedia1793059200000: rebuilding the table would also touch the rows that
 * reference it.
 */
export class RunRequestChecked1793318400000 implements MigrationInterface {
  name = 'RunRequestChecked1793318400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "test_event_detail" ADD COLUMN "request_checked" boolean NOT NULL DEFAULT (1)`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "test_event_detail" DROP COLUMN "request_checked"`
    );
  }
}
