import { resolve } from 'path';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseImportService {
  private readonly logger = new Logger(DatabaseImportService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource
  ) {}

  /**
   * Imports database data from a SQL file
   */
  async importProjectDatabase(sqlDumpPath: string): Promise<void> {
    // Check if connection is active
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      // Read SQL file
      const sqlContent = readFileSync(resolve(sqlDumpPath), 'utf8');
      this.logger.log(`Importing database from ${sqlDumpPath}`, sqlContent);

      await queryRunner.connect();

      await queryRunner.startTransaction();

      // Disable foreign key constraints temporarily
      await queryRunner.query('PRAGMA foreign_keys = OFF;');

      // Convert regular INSERT statements to INSERT OR REPLACE
      const modifiedSqlContent = sqlContent.replace(
        /INSERT INTO/gi,
        'INSERT OR REPLACE INTO'
      );

      // Execute modified SQL statements
      await queryRunner.query(modifiedSqlContent);

      // Re-enable foreign key constraints
      await queryRunner.query('PRAGMA foreign_keys = ON;');

      // Commit transaction
      await queryRunner.commitTransaction();

      this.logger.log('Database import completed successfully');
    } catch (error) {
      // Rollback transaction on error
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      this.logger.error(`Failed to import database`, error);
      throw new HttpException(
        `Failed to import database: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }
}
