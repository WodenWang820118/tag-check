import { Module } from '@nestjs/common';
import { EventInspectionPipelineService } from './event-inspection-pipeline.service';
import { InspectorModule } from '../inspector/inspector.module';
import { TestResultService } from '../test-result/services/test-result.service';
import { TestResultModule } from '../test-result/test-result.module';
import { ImageResultService } from '../test-result/services/image-result.service';
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
