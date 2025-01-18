import { Module } from '@nestjs/common';
import { EventInspectionPipelineService } from './event-inspection-pipeline.service';
import { InspectorModule } from '../inspector/inspector.module';
import { TestResultService } from '../test-result/test-result.service';
import { TestResultModule } from '../test-result/test-result.module';
@Module({
  imports: [InspectorModule, TestResultModule],
  providers: [EventInspectionPipelineService, TestResultService],
  exports: [EventInspectionPipelineService, InspectorModule, TestResultModule]
})
export class EventInspectionPipelineModule {}
