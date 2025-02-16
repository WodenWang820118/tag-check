import { Module } from '@nestjs/common';
import { EventInspectionPipelineService } from './event-inspection-pipeline.service';
import { InspectorModule } from '../../features/inspector/inspector.module';
import { TestReportFacadeModule } from '../repository/test-report-facade/test-report-facade.module';
import { TestReportFacadeRepositoryService } from '../repository/test-report-facade/test-report-facade-repository.service';
@Module({
  imports: [InspectorModule, TestReportFacadeModule],
  providers: [
    EventInspectionPipelineService,
    TestReportFacadeRepositoryService
  ],
  exports: [
    EventInspectionPipelineService,
    InspectorModule,
    TestReportFacadeModule
  ]
})
export class EventInspectionPipelineModule {}
