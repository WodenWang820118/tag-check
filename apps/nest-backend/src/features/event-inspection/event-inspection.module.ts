import { Module } from '@nestjs/common';
import { EventInspectionPipelineModule } from '../../features/event-inspection-pipeline/event-inspection-pipeline.module';
import { SingleEventInspectionService } from './single-event-inspection.service';
import { PuppeteerUtilsModule } from '../../features/web-agent/puppeteer-utils/puppeteer-utils.module';

@Module({
  imports: [EventInspectionPipelineModule, PuppeteerUtilsModule],
  providers: [SingleEventInspectionService],
  exports: [SingleEventInspectionService]
})
export class EventInspectionModule {}
