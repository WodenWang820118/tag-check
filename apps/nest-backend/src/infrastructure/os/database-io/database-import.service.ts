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
    private readonly dataSource: DataSource
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
      // 1) Convert regular INSERT to INSERT OR REPLACE (SQLite upsert-like)
      // 2) Add IF NOT EXISTS to CREATE TABLE/INDEX/TRIGGER
      const modifiedSqlContent = this.makeIdempotentSql(sqlContent);

      // Split the SQL content on semicolons (if simple; be cautious with semicolons inside strings)
      const statements = modifiedSqlContent
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      // Execute each statement sequentially
      for (const statement of statements) {
        // Skip wrapping transaction pragmas from dump; we manage transaction here
        const stmt = statement.trim();
        if (!stmt) continue;
        const upper = stmt.toUpperCase();
        if (
          upper.startsWith('BEGIN TRANSACTION') ||
          upper === 'COMMIT' ||
          upper.startsWith('PRAGMA FOREIGN_KEYS')
        ) {
          continue;
        }
        try {
          await queryRunner.query(stmt);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          // Gracefully skip idempotent schema errors
          if (
            /CREATE\s+(UNIQUE\s+)?INDEX/i.test(stmt) &&
            /already exists/i.test(msg)
          ) {
            this.logger.debug(
              `Skipping existing index: ${stmt.split('\n')[0]}`
            );
            continue;
          }
          if (/CREATE\s+TABLE/i.test(stmt) && /already exists/i.test(msg)) {
            this.logger.debug(
              `Skipping existing table: ${stmt.split('\n')[0]}`
            );
            continue;
          }
          if (/CREATE\s+TRIGGER/i.test(stmt) && /already exists/i.test(msg)) {
            this.logger.debug(
              `Skipping existing trigger: ${stmt.split('\n')[0]}`
            );
            continue;
          }
          // Attempt to auto-rewrite legacy INSERT statements that reference non-existent columns
          if (
            /^(-{2}.*\n)?\s*INSERT\s+/i.test(stmt) &&
            /no column named/i.test(msg)
          ) {
            const rewritten = await this.tryRewriteInsertToExistingColumns(
              queryRunner,
              stmt
            );
            if (rewritten) {
              this.logger.debug('Rewriting INSERT to match existing columns');
              await queryRunner.query(rewritten);
              continue;
            }
          }
          throw e;
        }
      }

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

  /**
   * Make SQL content more idempotent and re-import friendly for SQLite:
   * - INSERT INTO -> INSERT OR REPLACE INTO
   * - CREATE TABLE -> CREATE TABLE IF NOT EXISTS
   * - CREATE (UNIQUE) INDEX -> CREATE (UNIQUE) INDEX IF NOT EXISTS
   * - CREATE TRIGGER -> CREATE TRIGGER IF NOT EXISTS
   */
  private makeIdempotentSql(sql: string): string {
    let out = sql;
    // INSERT INTO -> INSERT OR REPLACE INTO
    out = out.replace(/\bINSERT\s+INTO\b/gi, 'INSERT OR REPLACE INTO');

    // CREATE TABLE -> CREATE TABLE IF NOT EXISTS (when not already present)
    out = out.replace(
      /(^|\n|;)\s*CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)/gi,
      (m) => `${m}IF NOT EXISTS `
    );

    // CREATE UNIQUE INDEX -> CREATE UNIQUE INDEX IF NOT EXISTS
    out = out.replace(
      /(^|\n|;)\s*CREATE\s+UNIQUE\s+INDEX\s+(?!IF\s+NOT\s+EXISTS)/gi,
      (m) => `${m}IF NOT EXISTS `
    );

    // CREATE INDEX -> CREATE INDEX IF NOT EXISTS
    out = out.replace(
      /(^|\n|;)\s*CREATE\s+INDEX\s+(?!IF\s+NOT\s+EXISTS)/gi,
      (m) => `${m}IF NOT EXISTS `
    );

    // CREATE TRIGGER -> CREATE TRIGGER IF NOT EXISTS
    out = out.replace(
      /(^|\n|;)\s*CREATE\s+TRIGGER\s+(?!IF\s+NOT\s+EXISTS)/gi,
      (m) => `${m}IF NOT EXISTS `
    );

    return out;
  }

  /**
   * If an INSERT references columns that don't exist in the target table, rewrite the
   * statement to include only existing columns (and matching values) using PRAGMA table_info.
   * Returns a new statement or null if it can't be parsed/repaired.
   */
  private async tryRewriteInsertToExistingColumns(
    queryRunner: import('typeorm').QueryRunner,
    originalStmt: string
  ): Promise<string | null> {
    const stmt = this.stripLeadingComments(originalStmt).trim();
    const insertRegex =
      /INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+([^\s(]+)\s*\(([^)]+)\)\s*VALUES\s*\(([\s\S]*)\)\s*;?\s*$/i;
    const match = insertRegex.exec(stmt);
    if (!match) return null;

    const tableToken = match[1].trim();
    const rawColumns = match[2];
    const rawValues = match[3];

    const tableName = this.normalizeIdentifier(tableToken);
    const existingCols = await this.getExistingColumns(queryRunner, tableName);
    if (!existingCols || existingCols.size === 0) return null;

    // Parse column tokens and values
    const colTokens = rawColumns
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    const values = this.splitSqlValues(rawValues);

    if (colTokens.length !== values.length) {
      // Can't reliably realign
      return null;
    }

    // Keep only columns that exist in table
    const keepIdx: number[] = [];
    colTokens.forEach((tok, i) => {
      const norm = this.normalizeIdentifier(tok);
      if (existingCols.has(norm)) keepIdx.push(i);
    });

    if (keepIdx.length === 0) return null;
    if (keepIdx.length === colTokens.length) return null; // nothing to change

    const newCols = keepIdx.map((i) => colTokens[i]).join(', ');
    const newVals = keepIdx.map((i) => values[i]).join(', ');

    // Always emit INSERT OR REPLACE for consistency
    const rewritten = `INSERT OR REPLACE INTO ${tableToken} (${newCols}) VALUES (${newVals});`;
    return rewritten;
  }

  private async getExistingColumns(
    queryRunner: import('typeorm').QueryRunner,
    tableName: string
  ): Promise<Set<string>> {
    // SQLite PRAGMA table_info returns columns for the given table
    const rows: Array<{ name: string }> = await queryRunner.query(
      `PRAGMA table_info(${this.quoteIdentifierForPragma(tableName)});`
    );
    const set = new Set<string>();
    for (const r of rows) {
      if (r && typeof r.name === 'string') set.add(r.name.toLowerCase());
    }
    return set;
  }

  private quoteIdentifierForPragma(name: string): string {
    // simple quoting with double quotes; double up any embedded quotes
    return `"${name.replace(/"/g, '""')}"`;
  }

  private normalizeIdentifier(token: string): string {
    // remove quotes/backticks/brackets and lower-case
    const t = token.trim();
    let s = t;
    const first = s[0];
    const last = s[s.length - 1];
    if (
      (first === '"' && last === '"') ||
      (first === '`' && last === '`') ||
      (first === '[' && last === ']')
    ) {
      s = s.slice(1, -1);
    }
    return s.toLowerCase();
  }

  // Basic SQL values splitter respecting single quotes and doubled quotes
  private splitSqlValues(valuesRaw: string): string[] {
    const result: string[] = [];
    let current = '';
    let i = 0;
    const len = valuesRaw.length;
    let depth = 0; // parentheses depth safeguard
    while (i < len) {
      const ch = valuesRaw[i];
      if (ch === "'") {
        const { text, next } = this.readQuoted(valuesRaw, i);
        current += text;
        i = next;
        continue;
      }
      if (ch === '(') depth++;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
        result.push(current.trim());
        current = '';
        i++;
        continue;
      }
      current += ch;
      i++;
    }
    if (current.trim().length > 0) result.push(current.trim());
    return result;
  }

  private readQuoted(
    valuesRaw: string,
    startIndex: number
  ): { text: string; next: number } {
    let i = startIndex;
    const len = valuesRaw.length;
    let text = '';
    // Append opening quote
    text += valuesRaw[i];
    i++;
    while (i < len) {
      const ch = valuesRaw[i];
      text += ch;
      if (ch === "'") {
        // doubled single-quote inside string literal
        if (i + 1 < len && valuesRaw[i + 1] === "'") {
          text += "'";
          i += 2;
          continue;
        }
        i++;
        break;
      }
      i++;
    }
    return { text, next: i };
  }

  private stripLeadingComments(sql: string): string {
    // Remove leading -- comment lines
    return sql.replace(/^(?:\s*--[^\n]*\n)+/g, '');
  }
}
