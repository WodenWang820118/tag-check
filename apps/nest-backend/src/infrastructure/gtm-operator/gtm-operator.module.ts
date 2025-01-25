import { Module } from '@nestjs/common';
import { GtmOperatorService } from './gtm-operator.service';
import { EventInspectionPipelineModule } from '../../features/event-inspection-pipeline/event-inspection-pipeline.module';
import { PuppeteerUtilsService } from '../../features/web-agent/puppeteer-utils/puppeteer-utils.service';
import { FolderPathService } from '../os/path/folder-path/folder-path.service';

@Module({
  imports: [EventInspectionPipelineModule],
  providers: [GtmOperatorService, PuppeteerUtilsService, FolderPathService],
  exports: [GtmOperatorService]
})
export class GtmOperatorModule {}
