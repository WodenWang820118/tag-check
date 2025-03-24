import { Injectable } from '@nestjs/common';
import { DatabaseDumpService } from './database-dump.service';
import { DatabaseImportService } from './database-import.service';

@Injectable()
export class DatabaseIoService {
  constructor(
    private databaseDumpService: DatabaseDumpService,
    private databaseImportService: DatabaseImportService
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
