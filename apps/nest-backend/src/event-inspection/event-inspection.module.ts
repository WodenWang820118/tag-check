import { Module } from '@nestjs/common';
import { EventInspectionPipelineService } from '../event-inspection-pipeline/event-inspection-pipeline.service';
import { GroupEventsInspectionService } from './group-events-inspection.service';
import { EventInspectionPipelineModule } from '../event-inspection-pipeline/event-inspection-pipeline.module';
import { SingleEventInspectionService } from './single-event-inspection.service';
import { PuppeteerUtilsService } from '../web-agent/puppeteer-utils/puppeteer-utils.service';

@Module({
  imports: [EventInspectionPipelineModule],
  providers: [
    GroupEventsInspectionService,
    SingleEventInspectionService,
    EventInspectionPipelineService,
    PuppeteerUtilsService,
  ],
  exports: [GroupEventsInspectionService, SingleEventInspectionService],
})
export class EventInspectionModule {}
