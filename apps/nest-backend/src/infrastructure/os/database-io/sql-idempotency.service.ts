import { Injectable } from '@nestjs/common';

@Injectable()
export class SqlIdempotencyService {
  /**
   * Make SQL content more idempotent and re-import friendly for SQLite:
   * - INSERT INTO -> INSERT OR REPLACE INTO
   * - CREATE TABLE -> CREATE TABLE IF NOT EXISTS
   * - CREATE (UNIQUE) INDEX -> CREATE (UNIQUE) INDEX IF NOT EXISTS
   * - CREATE TRIGGER -> CREATE TRIGGER IF NOT EXISTS
   */
  makeIdempotentSql(sql: string): string {
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
}
