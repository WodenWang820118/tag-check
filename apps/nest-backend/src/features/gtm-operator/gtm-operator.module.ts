import { Module } from '@nestjs/common';
import { GtmOperatorService } from './gtm-operator.service';
import { EventInspectionPipelineModule } from '../event-inspection-pipeline/event-inspection-pipeline.module';
import { PuppeteerUtilsService } from '../web-agent/puppeteer-utils/puppeteer-utils.service';
import { OsModule } from '../../infrastructure/os/os.module';

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule, EventInspectionPipelineModule],
  providers: [GtmOperatorService, PuppeteerUtilsService],
  exports: [GtmOperatorService]
})
export class GtmOperatorModule {}
