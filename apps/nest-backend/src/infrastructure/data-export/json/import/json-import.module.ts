import { Module } from '@nestjs/common';
import { JsonProjectImportService } from './json-project-import.service';
import { ImportOrchestrator } from './import-orchestrator.service';
import { JsonImportCoreModule } from '../core/json-import-core.module';

@Module({
  imports: [JsonImportCoreModule],
  providers: [JsonProjectImportService, ImportOrchestrator],
  exports: [JsonProjectImportService]
})
export class JsonImportModule {}
