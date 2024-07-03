import { EventInspectionPresetDto } from '../../dto/event-inspection-preset.dto';
import { Injectable, Logger } from '@nestjs/common';
import { Credentials } from 'puppeteer';
import { BROWSER_ARGS } from '../../configs/project.config';
import { PipelineService } from '../../pipeline/pipeline.service';
@Injectable()
export class WaiterDataLayerSingleEventService {
  constructor(private pipelineService: PipelineService) {}

  async inspectSingleEvent(
    projectName: string,
    eventId: string,
    headless: string,
    measurementId?: string,
    credentials?: Credentials,
    eventInspectionPresetDto?: EventInspectionPresetDto
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PCR = require('puppeteer-chromium-resolver');
    const options = {};
    const stats = await PCR(options);
    Logger.log(
      stats,
      'WaiterDataLayerSingleEventService.inspectSingleEvent: stats'
    );
    const browser = await stats.puppeteer.launch({
      headless: headless === 'true' ? true : false,
      defaultViewport: null,
      devtools: measurementId ? true : false,
      ignoreHTTPSErrors: true,
      args: eventInspectionPresetDto.puppeteerArgs || BROWSER_ARGS,
      executablePath: stats.executablePath,
    });
    Logger.log('Browser launched', 'waiter.inspectSingleEvent');
    const [page] = await browser.pages();

    return this.pipelineService.singleEventInspectionRecipe(
      page,
      projectName,
      eventId,
      headless,
      measurementId,
      credentials,
      eventInspectionPresetDto
    );
  }
}
