import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityMetadata } from 'typeorm';

@Injectable()
export class DatabaseSchemaDumpService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async dumpSchema(writeStream: NodeJS.WritableStream): Promise<void> {
    const driverType = this.dataSource.options.type;
    if (driverType !== 'sqlite') {
      writeStream.write('-- Schema dump not implemented for this DB type.\n\n');
      return;
    }

    const entities = this.dataSource.entityMetadatas;
    const tableNames = this.getEntityTableNames(entities);

    writeStream.write('-- === BEGIN SCHEMA ===\n');
    writeStream.write('PRAGMA foreign_keys = OFF;\n');

    await this.dumpCreateTables(writeStream, tableNames);
    await this.dumpIndexes(writeStream, tableNames);
    await this.dumpTriggers(writeStream, tableNames);

    writeStream.write('PRAGMA foreign_keys = ON;\n');
    writeStream.write('-- === END SCHEMA ===\n\n');
  }

  private getEntityTableNames(entities: EntityMetadata[]): string[] {
    return Array.from(
      new Set(
        entities
          .map((e) => e.tableName || e.name)
          .filter((n): n is string => !!n && !n.startsWith('sqlite_'))
      )
    );
  }

  private async dumpCreateTables(
    writeStream: NodeJS.WritableStream,
    tableNames: string[]
  ): Promise<void> {
    for (const tbl of tableNames) {
      const rows: Array<{ sql: string | null }> = await this.dataSource.query(
        `SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`,
        [tbl]
      );
      const createSql = rows?.[0]?.sql;
      if (createSql) {
        const adjusted = createSql.replace(
          /^\s*CREATE\s+TABLE\s+/i,
          'CREATE TABLE IF NOT EXISTS '
        );
        writeStream.write(`${adjusted};\n`);
      }
    }
  }

  private async dumpIndexes(
    writeStream: NodeJS.WritableStream,
    tableNames: string[]
  ): Promise<void> {
    for (const tbl of tableNames) {
      const idxRows: Array<{ sql: string | null }> =
        await this.dataSource.query(
          `SELECT sql FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND sql IS NOT NULL`,
          [tbl]
        );
      for (const r of idxRows) {
        if (r.sql) {
          const adjusted = r.sql.replace(
            /^\s*CREATE\s+(UNIQUE\s+)?INDEX\s+/i,
            (_m, unique: string | undefined) =>
              `CREATE ${unique ?? ''}INDEX IF NOT EXISTS `
          );
          writeStream.write(`${adjusted};\n`);
        }
      }
    }
  }

  private async dumpTriggers(
    writeStream: NodeJS.WritableStream,
    tableNames: string[]
  ): Promise<void> {
    for (const tbl of tableNames) {
      const trgRows: Array<{ sql: string | null }> =
        await this.dataSource.query(
          `SELECT sql FROM sqlite_master WHERE type = 'trigger' AND tbl_name = ?`,
          [tbl]
        );
      for (const r of trgRows) {
        if (r.sql) {
          const adjusted = r.sql.replace(
            /^\s*CREATE\s+TRIGGER\s+/i,
            'CREATE TRIGGER IF NOT EXISTS '
          );
          writeStream.write(`${adjusted};\n`);
        }
      }
    }
  }
}
