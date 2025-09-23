import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createWriteStream, mkdirSync, renameSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { DatabaseSchemaDumpService } from './database-schema-dump.service';
import { DatabaseDataDumpService } from './database-data-dump.service';
import { ProjectEntity } from '../../../shared';

@Injectable()
export class DatabaseDumpOrchestratorService {
  private readonly logger = new Logger(DatabaseDumpOrchestratorService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly schemaDump: DatabaseSchemaDumpService,
    private readonly dataDump: DatabaseDataDumpService
  ) {}

  async dumpProjectDatabase(
    projectSlug: string,
    outputPath: string
  ): Promise<void> {
    this.logger.log(
      `Dumping database for project ${projectSlug} to ${outputPath}`
    );

    if (!outputPath.endsWith('.sql')) {
      outputPath = join(outputPath, `${projectSlug}_dump.sql`);
    }

    const directory = dirname(outputPath);
    mkdirSync(directory, { recursive: true });

    const projectEntity = await this.dataSource
      .getRepository(ProjectEntity)
      .findOne({ where: { projectSlug } });

    if (!projectEntity) {
      throw new Error(`Project with projectSlug ${projectSlug} not found`);
    }
    const projectId = projectEntity.id;

    const tempOutputPath = outputPath.endsWith('.tmp')
      ? outputPath
      : `${outputPath}.tmp`;
    const writeStream = createWriteStream(tempOutputPath);

    try {
      await this.schemaDump.dumpSchema(writeStream);
      await this.dataDump.dumpAllEntitiesForProject(writeStream, projectId);

      writeStream.end();
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
      });

      renameSync(tempOutputPath, outputPath);
      this.logger.log(`Database dump completed for project ${projectSlug}`);
    } catch (error) {
      writeStream.end();
      try {
        unlinkSync(tempOutputPath);
      } catch (cleanupError) {
        this.logger.debug(
          `Failed to cleanup temp dump file: ${String(cleanupError)}`
        );
      }
      throw error;
    }
  }
}
