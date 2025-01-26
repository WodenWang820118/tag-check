import { Module } from '@nestjs/common';
import { EventInspectionPipelineService } from './event-inspection-pipeline.service';
import { InspectorModule } from '../../features/inspector/inspector.module';
import { TestResultService } from '../test-result/test-result.service';
import { TestResultModule } from '../../features/test-result/test-result.module';
import { ImageResultService } from '../test-result/image-result.service';
@Module({
  imports: [InspectorModule, TestResultModule],
  providers: [
    EventInspectionPipelineService,
    TestResultService,
    ImageResultService
  ],
  exports: [EventInspectionPipelineService, InspectorModule, TestResultModule]
})
export class EventInspectionPipelineModule {}
