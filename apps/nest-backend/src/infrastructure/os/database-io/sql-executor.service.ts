import { Injectable, Logger } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { InsertRewriterService } from './insert-rewriter.service';

@Injectable()
export class SqlExecutorService {
  private readonly logger = new Logger(SqlExecutorService.name);

  constructor(private readonly insertRewriter: InsertRewriterService) {}

  async executeStatements(
    queryRunner: QueryRunner,
    statements: string[]
  ): Promise<void> {
    for (const statement of statements) {
      const stmt = statement.trim();
      if (!stmt) continue;
      try {
        await queryRunner.query(stmt);
      } catch (e: unknown) {
        const handled = await this.handleError(queryRunner, stmt, e);
        if (!handled) throw e;
      }
    }
  }

  private isAlreadyExistsError(stmt: string, msg: string): boolean {
    if (
      /CREATE\s+(UNIQUE\s+)?INDEX/i.test(stmt) &&
      /already exists/i.test(msg)
    ) {
      this.logger.debug(`Skipping existing index: ${stmt.split('\n')[0]}`);
      return true;
    }
    if (/CREATE\s+TABLE/i.test(stmt) && /already exists/i.test(msg)) {
      this.logger.debug(`Skipping existing table: ${stmt.split('\n')[0]}`);
      return true;
    }
    if (/CREATE\s+TRIGGER/i.test(stmt) && /already exists/i.test(msg)) {
      this.logger.debug(`Skipping existing trigger: ${stmt.split('\n')[0]}`);
      return true;
    }
    return false;
  }

  private async tryHandleInsertRewrite(
    queryRunner: QueryRunner,
    stmt: string,
    msg: string
  ): Promise<boolean> {
    if (/^(--.*\n)?\s*INSERT\s+/i.test(stmt) && /no column named/i.test(msg)) {
      const rewritten =
        await this.insertRewriter.tryRewriteInsertToExistingColumns(
          queryRunner,
          stmt
        );
      if (rewritten) {
        this.logger.debug('Rewriting INSERT to match existing columns');
        await queryRunner.query(rewritten);
        return true;
      }
    }
    return false;
  }

  private async handleError(
    queryRunner: QueryRunner,
    stmt: string,
    error: unknown
  ): Promise<boolean> {
    const msg = error instanceof Error ? error.message : String(error);
    if (this.isAlreadyExistsError(stmt, msg)) return true;
    if (await this.tryHandleInsertRewrite(queryRunner, stmt, msg)) return true;
    return false;
  }
}
