import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ProjectEntity } from '../../../shared';
import { createWriteStream, mkdirSync, renameSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { DataSource, EntityMetadata } from 'typeorm';

@Injectable()
export class DatabaseDumpService {
  private readonly logger = new Logger(DatabaseDumpService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  /**
   * Dumps project-related database data to a SQL file
   */
  async dumpProjectDatabase(
    projectSlug: string,
    outputPath: string
  ): Promise<void> {
    this.logger.log(
      `Dumping database for project ${projectSlug} to ${outputPath}`
    );

    // Ensure outputPath is a file path, not just a directory
    if (!outputPath.endsWith('.sql')) {
      // Append a filename if only a directory was provided
      outputPath = join(outputPath, `${projectSlug}_dump.sql`);
    }

    // Create directory if it doesn't exist
    const directory = dirname(outputPath);
    mkdirSync(directory, { recursive: true });

    // Get the project entity
    const projectEntity = await this.dataSource
      .getRepository(ProjectEntity)
      .findOne({ where: { projectSlug: projectSlug } });

    if (!projectEntity) {
      throw new Error(`Project with projectSlug ${projectSlug} not found`);
    }

    const projectId = projectEntity.id;

    // Write to a temporary file first, then atomically rename on success
    const tempOutputPath = outputPath.endsWith('.tmp')
      ? outputPath
      : `${outputPath}.tmp`;

    // Open a write stream for the temporary SQL file
    const writeStream = createWriteStream(tempOutputPath);

    try {
      // Get metadata for all entities
      const entities = this.dataSource.entityMetadatas;

      // Write header and schema for the involved tables (SQLite)
      await this.dumpSchema(writeStream, entities);

      // Process each entity
      for (const entity of entities) {
        await this.dumpEntityData(writeStream, entity, projectId);
      }

      // Finish the stream
      writeStream.end();

      // Wait for the write stream to finish
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
      });

      // Atomically move the temp file to the final destination
      renameSync(tempOutputPath, outputPath);

      this.logger.log(`Database dump completed for project ${projectSlug}`);
    } catch (error) {
      writeStream.end();
      // Best-effort cleanup of the temporary file
      try {
        unlinkSync(tempOutputPath);
      } catch {
        // ignore
      }
      throw error;
    }
  }

  /**
   * Dumps data for a specific entity related to the project
   */
  async dumpEntityData(
    writeStream: NodeJS.WritableStream,
    entity: EntityMetadata,
    projectId: number | string
  ): Promise<void> {
    const repository = this.dataSource.getRepository(entity.name);
    let records;

    // Query records related to this project
    if (entity.name === ProjectEntity.name) {
      // For the Project entity, only get the specific project
      records = await repository.find({ where: { id: projectId } });
    } else if (
      entity.columns.some((column) => column.propertyName === 'projectId')
    ) {
      // For entities with direct project relationship
      records = await repository.find({ where: { projectId } });
    } else if (
      entity.columns.some((column) => column.propertyName === 'project')
    ) {
      // For entities with project relation
      records = await repository.find({
        where: { project: { id: projectId } }
      });
    } else {
      // Skip entities not related to projects
      return;
    }

    if (!records || records.length === 0) return;

    // Write INSERT statements for this entity
    await this.writeInsertStatements(writeStream, entity, records);
  }

  /**
   * Quotes and escapes a database identifier (table or column).
   */
  private quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  /**
   * Quotes and escapes a value for SQL insertion.
   */
  private quoteValue(value: unknown): string {
    if (value === null || value === undefined) {
      return 'NULL';
    } else if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    } else if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    } else if (Buffer.isBuffer(value)) {
      return `X'${value.toString('hex')}'`;
    } else if (typeof value === 'object') {
      return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    } else if (typeof value === 'boolean') {
      return value ? '1' : '0';
    } else {
      return JSON.stringify(value, null, 2);
    }
  }

  /**
   * Writes INSERT statements for entity records
   */
  private async writeInsertStatements(
    writeStream: NodeJS.WritableStream,
    entity: EntityMetadata,
    records: unknown[]
  ): Promise<void> {
    if (records.length === 0) return;

    // Comment for this entity
    writeStream.write(
      `-- Data for entity: ${entity.name} (table: ${entity.tableName})\n`
    );

    // Prepare columns strictly from TypeORM metadata to avoid relation props
    const columnMetas = entity.columns;
    const columns = columnMetas
      .map((col) => this.quoteIdentifier(col.databaseName))
      .join(', ');
    const table = this.quoteIdentifier(entity.tableName);

    // Write each record as an INSERT
    for (const rec of records) {
      const row = rec as Record<string, unknown>;
      const vals = columnMetas.map((col) =>
        this.quoteValue(row[col.propertyName as keyof typeof row])
      );
      writeStream.write(
        `INSERT INTO ${table} (${columns}) VALUES (${vals.join(', ')});\n`
      );
    }
    writeStream.write('\n');
  }

  /**
   * Writes the schema for all tables and related indexes/triggers used by the entities.
   * Currently optimized for SQLite by querying sqlite_master. Other databases can be
   * supported by extending this function based on the active driver.
   */
  private async dumpSchema(
    writeStream: NodeJS.WritableStream,
    entities: EntityMetadata[]
  ): Promise<void> {
    // Only implement for SQLite for now
    const driverType = this.dataSource.options.type;
    if (driverType !== 'sqlite') {
      writeStream.write('-- Schema dump not implemented for this DB type.\n\n');
      return;
    }

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
          // Preserve UNIQUE if present while making the statement idempotent
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
