import { Module } from '@nestjs/common';
import { EventInspectionPipelineService } from '../../features/event-inspection-pipeline/event-inspection-pipeline.service';
import { GroupEventsInspectionService } from './group-events-inspection.service';
import { EventInspectionPipelineModule } from '../../features/event-inspection-pipeline/event-inspection-pipeline.module';
import { SingleEventInspectionService } from './single-event-inspection.service';
import { PuppeteerUtilsService } from '../../features/web-agent/puppeteer-utils/puppeteer-utils.service';

@Module({
  imports: [EventInspectionPipelineModule],
  providers: [
    GroupEventsInspectionService,
    SingleEventInspectionService,
    EventInspectionPipelineService,
    PuppeteerUtilsService
  ],
  exports: [GroupEventsInspectionService, SingleEventInspectionService]
})
export class EventInspectionModule {}
