import { Injectable } from '@nestjs/common';
import { QueryRunner } from 'typeorm';
import { SqlUtilsService } from './sql-utils.service';

@Injectable()
export class InsertRewriterService {
  constructor(private readonly sqlUtils: SqlUtilsService) {}

  async tryRewriteInsertToExistingColumns(
    queryRunner: QueryRunner,
    originalStmt: string
  ): Promise<string | null> {
    const stmt = this.sqlUtils.stripLeadingComments(originalStmt).trim();
    const insertRegex =
      /INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+([^\s(]+)\s*\(([^)]+)\)\s*VALUES\s*\(([\s\S]*)\)\s*;?\s*$/i;
    const match = insertRegex.exec(stmt);
    if (!match) return null;

    const tableToken = match[1].trim();
    const rawColumns = match[2];
    const rawValues = match[3];

    const tableName = this.sqlUtils.normalizeIdentifier(tableToken);
    const existingCols = await this.getExistingColumns(queryRunner, tableName);
    if (!existingCols || existingCols.size === 0) return null;

    const colTokens = rawColumns
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    const values = this.sqlUtils.splitSqlValues(rawValues);

    if (colTokens.length !== values.length) {
      return null;
    }

    const keepIdx: number[] = [];
    colTokens.forEach((tok, i) => {
      const norm = this.sqlUtils.normalizeIdentifier(tok);
      if (existingCols.has(norm)) keepIdx.push(i);
    });

    if (keepIdx.length === 0) return null;
    if (keepIdx.length === colTokens.length) return null;

    const newCols = keepIdx.map((i) => colTokens[i]).join(', ');
    const newVals = keepIdx.map((i) => values[i]).join(', ');

    const rewritten = `INSERT OR REPLACE INTO ${tableToken} (${newCols}) VALUES (${newVals});`;
    return rewritten;
  }

  private async getExistingColumns(
    queryRunner: QueryRunner,
    tableName: string
  ): Promise<Set<string>> {
    const rows: Array<{ name: string }> = await queryRunner.query(
      `PRAGMA table_info(${this.sqlUtils.quoteIdentifierForPragma(tableName)});`
    );
    const set = new Set<string>();
    for (const r of rows) {
      if (r && typeof r.name === 'string') set.add(r.name.toLowerCase());
    }
    return set;
  }
}
