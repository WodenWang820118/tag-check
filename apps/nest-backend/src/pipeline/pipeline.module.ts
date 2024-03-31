import { Module } from '@nestjs/common';
import { PipelineService } from './pipeline.service';
import { InspectorModule } from '../inspector/inspector.module';
import { XlsxReportModule } from '../os/xlsx-report/xlsx-report.module';
import { AbstractDatalayerReportModule } from '../os/abstract-datalayer-report/abstract-datalayer-report.module';

@Module({
  imports: [InspectorModule, XlsxReportModule, AbstractDatalayerReportModule],
  providers: [PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}
