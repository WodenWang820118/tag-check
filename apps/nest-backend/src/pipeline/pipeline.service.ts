import { XlsxReportSingleEventService } from './../os/xlsx-report/xlsx-report-single-event.service';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import puppeteer, { Credentials, Page } from 'puppeteer';
import { BROWSER_ARGS } from '../configs/project.config';
import { getCurrentTimestamp } from '../waiter/utils';
import { InspectEventDto } from '../dto/inspect-event.dto';
import { InspectorSingleEventService } from '../inspector/inspector-single-event.service';
import { AbstractReportService } from '../os/abstract-report/abstract-report.service';
@Injectable()
export class PipelineService {
  constructor(
    private inspectorSingleEventService: InspectorSingleEventService,
    private xlsxReportSingleEventService: XlsxReportSingleEventService,
    private abstractReportService: AbstractReportService
  ) {}

  async singleEventInspectionRecipe(
    page: Page,
    projectName: string,
    testName: string,
    headless: string,
    path?: string,
    measurementId?: string,
    credentials?: Credentials,
    inspectEventDto?: InspectEventDto
  ) {
    // 3.1) inspect both dataLayer and the request sent to GA4
    // const browser = await puppeteer.launch({
    //   headless: headless === 'true' ? 'new' : false,
    //   defaultViewport: null,
    //   ignoreHTTPSErrors: true,
    //   args:
    //     (inspectEventDto as any).inspectEventDto.puppeteerArgs || BROWSER_ARGS,
    // });
    // Logger.log('Browser launched', 'waiter.inspectSingleEvent');
    // const [page] = await browser.pages();

    const result = await this.inspectorSingleEventService.inspectDataLayer(
      page,
      projectName,
      testName,
      headless,
      path,
      measurementId,
      credentials,
      (inspectEventDto as any).inspectEventDto.application
    );

    Logger.log('DataLayer inspected', 'waiter.inspectSingleEvent');

    // 3.2) construct the data to be written to the xlsx file
    const data = [
      {
        dataLayerResult: result.dataLayerResult,
        rawRequest: result.rawRequest,
        requestCheckResult: result.requestCheckResult,
        destinationUrl: result.destinationUrl,
      },
    ];

    Logger.log('Data constructed', 'waiter.inspectSingleEvent');
    // 3.3) write the data to the xlsx file
    const timestamp = getCurrentTimestamp();
    await this.xlsxReportSingleEventService.writeXlsxFile(
      `QA_report_single_${testName}_${timestamp}.xlsx`,
      'Sheet1',
      data,
      testName,
      projectName
    );

    // 3.4) write the .json file for other information such as last test time and the test result
    await this.abstractReportService.writeSingleAbstractTestResultJson(
      projectName,
      testName,
      data[0].dataLayerResult
    );
    return data;
  }
}
