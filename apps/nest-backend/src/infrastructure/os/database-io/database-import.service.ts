import { resolve } from 'path';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { DataSource } from 'typeorm';
import { SqlIdempotencyService } from './sql-idempotency.service';
import { SqlStatementParserService } from './sql-statement-parser.service';
import { SqlExecutorService } from './sql-executor.service';

@Injectable()
export class DatabaseImportService {
  private readonly logger = new Logger(DatabaseImportService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly sqlIdempotency: SqlIdempotencyService,
    private readonly sqlParser: SqlStatementParserService,
    private readonly sqlExecutor: SqlExecutorService
  ) {}

  /**
   * Imports database data from a SQL file
   */
  async importProjectDatabase(sqlDumpPath: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      const sqlContent = readFileSync(resolve(sqlDumpPath), 'utf8');
      // Log only the path to avoid huge/circular log entries
      this.logger.log(`Importing database from ${sqlDumpPath}`);
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Disable foreign key constraints temporarily (SQLite)
      await queryRunner.query('PRAGMA foreign_keys = OFF;');

      // Massage SQL for idempotency and safe re-imports
      const modifiedSqlContent =
        this.sqlIdempotency.makeIdempotentSql(sqlContent);

      // Split into executable statements, skipping dump-wrapping pragmas
      const statements = this.sqlParser.splitIntoStatements(modifiedSqlContent);

      // Execute sequentially with robust error handling
      await this.sqlExecutor.executeStatements(queryRunner, statements);

      // Re-enable foreign key constraints
      await queryRunner.query('PRAGMA foreign_keys = ON;');
      await queryRunner.commitTransaction();
      this.logger.log('Database import completed successfully');
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      this.logger.error(`Failed to import database`, error);
      throw new HttpException(
        `Failed to import database: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      await queryRunner.release();
    }
  }
}
