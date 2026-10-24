import { Module } from '@nestjs/common';
import { GtmOperatorService } from './gtm-operator.service';
import { EventInspectionPipelineModule } from '../event-inspection-pipeline/event-inspection-pipeline.module';
import { PuppeteerUtilsModule } from '../web-agent/puppeteer-utils/puppeteer-utils.module';

/** Provides accompanied-mode runs through GTM Preview. */
@Module({
  imports: [EventInspectionPipelineModule, PuppeteerUtilsModule],
  providers: [GtmOperatorService],
  exports: [GtmOperatorService]
})
export class GtmOperatorModule {}
