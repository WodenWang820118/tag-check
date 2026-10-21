import { Module } from '@nestjs/common';
import { GtmOperatorService } from './gtm-operator.service';
import { EventInspectionPipelineModule } from '../event-inspection-pipeline/event-inspection-pipeline.module';
import { PuppeteerUtilsModule } from '../web-agent/puppeteer-utils/puppeteer-utils.module';
import { OsModule } from '../../infrastructure/os/os.module';

@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule, EventInspectionPipelineModule, PuppeteerUtilsModule],
  providers: [GtmOperatorService],
  exports: [GtmOperatorService]
})
export class GtmOperatorModule {}
