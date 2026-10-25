import { Module } from '@nestjs/common';
import { EventInspectionPipelineService } from './event-inspection-pipeline.service';
import { RunQueueService } from './run-queue.service';
import { RunTrackerService } from './run-tracker.service';
import { OsModule } from '../../infrastructure/os/os.module';
import { EventsGatewayModule } from '../../core/events-gateway/events-gateway.module';
import { InspectorModule } from '../../features/inspector/inspector.module';
import { TestReportFacadeModule } from '../repository/test-report-facade/test-report-facade.module';
/**
 * Provides the inspection pipeline, the queue every run waits in and the
 * tracker that reports each run's status.
 */
@Module({
  imports: [
    InspectorModule,
    TestReportFacadeModule,
    OsModule,
    EventsGatewayModule
  ],
  providers: [
    EventInspectionPipelineService,
    RunQueueService,
    RunTrackerService
  ],
  exports: [
    EventInspectionPipelineService,
    RunQueueService,
    RunTrackerService,
    InspectorModule,
    TestReportFacadeModule
  ]
})
export class EventInspectionPipelineModule {}
