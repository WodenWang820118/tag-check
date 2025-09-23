import { Injectable } from '@nestjs/common';
import { DatabaseDumpOrchestratorService } from './database-dump-orchestrator.service';
import { DatabaseImportService } from './database-import.service';

@Injectable()
export class DatabaseIoService {
  constructor(
    private readonly databaseDumpService: DatabaseDumpOrchestratorService,
    private readonly databaseImportService: DatabaseImportService
  ) {}

  async dumpProjectDatabase(
    projectSlug: string,
    outputPath: string
  ): Promise<void> {
    await this.databaseDumpService.dumpProjectDatabase(projectSlug, outputPath);
  }

  async importProjectDatabase(sqlDumpPath: string): Promise<void> {
    await this.databaseImportService.importProjectDatabase(sqlDumpPath);
  }
}
