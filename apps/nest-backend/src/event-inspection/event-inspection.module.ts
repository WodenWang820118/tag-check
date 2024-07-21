import { Module } from '@nestjs/common';
import { EventInspectionPipelineService } from '../event-inspection-pipeline/event-inspection-pipeline.service';
import { InspectorModule } from '../inspector/inspector.module';
import { XlsxReportModule } from '../os/xlsx-report/xlsx-report.module';
import { AbstractReportModule } from '../os/abstract-report/abstract-report.module';
import { GroupEventsInspectionService } from './group-events-inspection.service';
import { OsModule } from '../os/os.module';
import { EventInspectionPipelineModule } from '../event-inspection-pipeline/event-inspection-pipeline.module';
import { SingleEventInspectionService } from './single-event-inspection.service';

@Module({
  imports: [
    InspectorModule,
    XlsxReportModule,
    AbstractReportModule,
    OsModule,
    EventInspectionPipelineModule,
  ],
  providers: [
    GroupEventsInspectionService,
    SingleEventInspectionService,
    EventInspectionPipelineService,
  ],
  exports: [GroupEventsInspectionService, SingleEventInspectionService],
})
export class EventInspectionModule {}
