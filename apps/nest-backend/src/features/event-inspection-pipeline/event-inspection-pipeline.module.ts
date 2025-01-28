import { Module } from '@nestjs/common';
import { EventInspectionPipelineService } from './event-inspection-pipeline.service';
import { InspectorModule } from '../../features/inspector/inspector.module';
import { TestResultService } from '../repository/test-report-facade/test-result.service';
import { TestReportFacadeModule } from '../repository/test-report-facade/test-report-facade.module';
import { TestImageService } from '../repository/test-report-facade/image-result.service';
@Module({
  imports: [InspectorModule, TestReportFacadeModule],
  providers: [
    EventInspectionPipelineService,
    TestResultService,
    TestImageService
  ],
  exports: [
    EventInspectionPipelineService,
    InspectorModule,
    TestReportFacadeModule
  ]
})
export class EventInspectionPipelineModule {}
