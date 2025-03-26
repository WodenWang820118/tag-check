import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ProjectEntity } from '../../../shared';
import { createWriteStream, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { DataSource, EntityMetadata } from 'typeorm';

@Injectable()
export class DatabaseDumpService {
  private readonly logger = new Logger(DatabaseDumpService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource
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

    // Open a write stream for the SQL file
    const writeStream = createWriteStream(outputPath);

    try {
      // Get metadata for all entities
      const entities = this.dataSource.entityMetadatas;

      // Process each entity
      for (const entity of entities) {
        await this.dumpEntityData(writeStream, entity, projectId);
      }

      // End transaction
      writeStream.end();

      // Wait for the write stream to finish
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
      });

      this.logger.log(`Database dump completed for project ${projectSlug}`);
    } catch (error) {
      writeStream.end();
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
   * Writes INSERT statements for entity records
   */
  private async writeInsertStatements(
    writeStream: NodeJS.WritableStream,
    entity: EntityMetadata,
    records: any[]
  ): Promise<void> {
    if (records.length === 0) return;

    // Get the actual table name from the entity metadata
    const tableName = entity.tableName;

    // Write a comment for this entity
    writeStream.write(
      `-- Data for entity: ${entity.name} (table: ${tableName})\n`
    );

    // Get the property-to-column mapping from entity metadata
    const columnMapping = new Map<string, string>();
    entity.columns.forEach((column) => {
      columnMapping.set(column.propertyName, column.databaseName);
    });

    // Get property names from the first record
    const propertyNames = Object.keys(records[0]).filter((prop) => {
      const value = records[0][prop];
      return value !== undefined && typeof value !== 'function';
    });

    // Map property names to database column names
    const columnNames = propertyNames.map(
      (prop) => columnMapping.get(prop) || prop // Fallback to property name if mapping not found
    );

    // Process each record
    for (const record of records) {
      const values = propertyNames.map((prop) => {
        const value = record[prop];

        if (value === null || value === undefined) {
          return 'NULL';
        } else if (typeof value === 'string') {
          // Escape single quotes in strings
          return `'${value.replace(/'/g, "''")}'`;
        } else if (value instanceof Date) {
          return `'${value.toISOString()}'`;
        } else if (typeof value === 'object') {
          if (Buffer.isBuffer(value)) {
            // Handle Buffer objects (BLOBs)
            return `X'${value.toString('hex')}'`;
          } else {
            // Handle JSON objects
            return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
          }
        } else if (typeof value === 'boolean') {
          // SQLite doesn't have a boolean type, store as 0 or 1
          return value ? 1 : 0;
        } else {
          return value;
        }
      });

      // Write the INSERT statement using the database column names
      writeStream.write(
        `INSERT INTO "${tableName}" (${columnNames.map((c) => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`
      );
    }

    writeStream.write('\n');
  }
}
