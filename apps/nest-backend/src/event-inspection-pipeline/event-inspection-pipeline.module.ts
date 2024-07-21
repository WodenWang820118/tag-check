import { Module } from '@nestjs/common';
import { EventInspectionPipelineService } from './event-inspection-pipeline.service';
import { InspectorModule } from '../inspector/inspector.module';
import { ProjectAgentModule } from '../project-agent/project-agent.module';
@Module({
  imports: [InspectorModule, ProjectAgentModule],
  providers: [EventInspectionPipelineService],
  exports: [
    EventInspectionPipelineService,
    InspectorModule,
    ProjectAgentModule,
  ],
})
export class EventInspectionPipelineModule {}
