import { Module } from '@nestjs/common';
import { EventInspectionPipelineService } from './event-inspection-pipeline.service';
import { InspectorModule } from '../inspector/inspector.module';
import { XlsxReportModule } from '../os/xlsx-report/xlsx-report.module';
import { AbstractReportModule } from '../os/abstract-report/abstract-report.module';

@Module({
  imports: [InspectorModule, XlsxReportModule, AbstractReportModule],
  providers: [EventInspectionPipelineService],
  exports: [EventInspectionPipelineService],
})
export class EventInspectionPipelineModule {}
