import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityMetadata } from 'typeorm';
import { ProjectEntity } from '../../../shared';
import { DatabaseSerializationService } from './database-serialization.service';

@Injectable()
export class DatabaseDataDumpService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly serializer: DatabaseSerializationService
  ) {}

  async dumpAllEntitiesForProject(
    writeStream: NodeJS.WritableStream,
    projectId: number | string
  ): Promise<void> {
    const entities = this.dataSource.entityMetadatas;
    for (const entity of entities) {
      await this.dumpEntityData(writeStream, entity, projectId);
    }
  }

  async dumpEntityData(
    writeStream: NodeJS.WritableStream,
    entity: EntityMetadata,
    projectId: number | string
  ): Promise<void> {
    const repository = this.dataSource.getRepository(entity.name);
    let records: unknown[] | undefined;

    if (entity.name === ProjectEntity.name) {
      records = await repository.find({ where: { id: projectId } });
    } else if (entity.columns.some((c) => c.propertyName === 'projectId')) {
      records = await repository.find({ where: { projectId } });
    } else if (entity.columns.some((c) => c.propertyName === 'project')) {
      records = await repository.find({
        where: { project: { id: projectId } }
      });
    } else {
      return;
    }

    if (!records || records.length === 0) return;
    await this.writeInsertStatements(writeStream, entity, records);
  }

  private async writeInsertStatements(
    writeStream: NodeJS.WritableStream,
    entity: EntityMetadata,
    records: unknown[]
  ): Promise<void> {
    if (records.length === 0) return;
    writeStream.write(
      `-- Data for entity: ${entity.name} (table: ${entity.tableName})\n`
    );
    const columnMetas = entity.columns;
    const columns = columnMetas
      .map((c) => this.serializer.quoteIdentifier(c.databaseName))
      .join(', ');
    const table = this.serializer.quoteIdentifier(entity.tableName);
    for (const rec of records) {
      const row = rec as Record<string, unknown>;
      const vals = columnMetas.map((col) =>
        this.serializer.quoteValue(row[col.propertyName as keyof typeof row])
      );
      writeStream.write(
        `INSERT INTO ${table} (${columns}) VALUES (${vals.join(', ')});\n`
      );
    }
    writeStream.write('\n');
  }
}
