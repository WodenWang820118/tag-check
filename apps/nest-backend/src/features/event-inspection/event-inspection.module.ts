import { Module } from '@nestjs/common';
import { GroupEventsInspectionService } from './group-events-inspection.service';
import { EventInspectionPipelineModule } from '../../features/event-inspection-pipeline/event-inspection-pipeline.module';
import { SingleEventInspectionService } from './single-event-inspection.service';
import { PuppeteerUtilsModule } from '../../features/web-agent/puppeteer-utils/puppeteer-utils.module';

@Module({
  imports: [EventInspectionPipelineModule, PuppeteerUtilsModule],
  providers: [GroupEventsInspectionService, SingleEventInspectionService],
  exports: [GroupEventsInspectionService, SingleEventInspectionService]
})
export class EventInspectionModule {}
