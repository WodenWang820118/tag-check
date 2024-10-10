import { Module } from '@nestjs/common';
import { EventInspectionPipelineService } from './event-inspection-pipeline.service';
import { InspectorModule } from '../inspector/inspector.module';
@Module({
  imports: [InspectorModule],
  providers: [EventInspectionPipelineService],
  exports: [EventInspectionPipelineService, InspectorModule],
})
export class EventInspectionPipelineModule {}
