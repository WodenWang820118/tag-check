import { Injectable } from '@nestjs/common';

@Injectable()
export class SqlStatementParserService {
  splitIntoStatements(sql: string): string[] {
    const statements = sql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)
      .filter((stmt) => !this.shouldSkip(stmt));

    return statements;
  }

  private shouldSkip(stmt: string): boolean {
    const upper = stmt.trim().toUpperCase();
    return (
      upper.startsWith('BEGIN TRANSACTION') ||
      upper === 'COMMIT' ||
      upper.startsWith('PRAGMA FOREIGN_KEYS')
    );
  }
}
