import { EventInspectionPresetDto } from '../../dto/event-inspection-preset.dto';
import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Credentials } from 'puppeteer';
import { BROWSER_ARGS } from '../../configs/project.config';
import { PipelineService } from '../../pipeline/pipeline.service';
// import { IInspectEventDto } from '@utils';
@Injectable()
export class WaiterDataLayerSingleEventService {
  constructor(private pipelineService: PipelineService) {}

  async inspectSingleEvent(
    projectName: string,
    testName: string,
    headless: string,
    measurementId?: string,
    credentials?: Credentials,
    eventInspectionPresetDto?: EventInspectionPresetDto
  ) {
    const browser = await puppeteer.launch({
      headless: headless === 'true' ? true : false,
      defaultViewport: null,
      devtools: measurementId ? true : false,
      ignoreHTTPSErrors: true,
      args: eventInspectionPresetDto.puppeteerArgs || BROWSER_ARGS,
    });
    Logger.log('Browser launched', 'waiter.inspectSingleEvent');
    const [page] = await browser.pages();

    return this.pipelineService.singleEventInspectionRecipe(
      page,
      projectName,
      testName,
      headless,
      measurementId,
      credentials,
      eventInspectionPresetDto
    );
  }
}
