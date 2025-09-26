import { Global, Module } from '@nestjs/common';
import { JsonImportModule } from './json/import/json-import.module';
import { JsonExportModule } from './json/export/json-export.module';

@Global()
@Module({
  imports: [JsonImportModule, JsonExportModule],
  providers: [],
  exports: [JsonImportModule, JsonExportModule]
})
export class ProjectDataExportModule {}
