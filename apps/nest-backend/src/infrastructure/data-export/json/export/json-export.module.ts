import { Module } from '@nestjs/common';
import { JsonProjectExportService } from './json-project-export.service';

@Module({
  providers: [JsonProjectExportService],
  exports: [JsonProjectExportService]
})
export class JsonExportModule {}
