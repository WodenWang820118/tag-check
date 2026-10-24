import { Module } from '@nestjs/common';
import { EventInspectionPipelineService } from './event-inspection-pipeline.service';
import { RunQueueService } from './run-queue.service';
import { InspectorModule } from '../../features/inspector/inspector.module';
import { TestReportFacadeModule } from '../repository/test-report-facade/test-report-facade.module';
/** Provides the inspection pipeline and the queue every run waits in. */
@Module({
  imports: [InspectorModule, TestReportFacadeModule],
  providers: [EventInspectionPipelineService, RunQueueService],
  exports: [
    EventInspectionPipelineService,
    RunQueueService,
    InspectorModule,
    TestReportFacadeModule
  ]
})
export class EventInspectionPipelineModule {}
