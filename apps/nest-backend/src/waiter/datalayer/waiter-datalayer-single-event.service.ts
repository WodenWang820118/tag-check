import { Injectable, Logger } from '@nestjs/common';
import { InspectorSingleEventService } from '../../inspector/inspector-single-event.service';
import { AbstractReportService } from '../../os/abstract-report/abstract-report.service';
import { XlsxReportSingleEventService } from '../../os/xlsx-report/xlsx-report-single-event.service';
import { getCurrentTimestamp } from '../utils';
import puppeteer, { Credentials } from 'puppeteer';
import { BROWSER_ARGS } from '../../configs/project.config';

@Injectable()
export class WaiterDataLayerSingleEventService {
  constructor(
    private xlsxReportSingleEventService: XlsxReportSingleEventService,
    private inspectorSingleEventService: InspectorSingleEventService,
    private abstractReportService: AbstractReportService
  ) {}

  async inspectSingleEvent(
    projectName: string,
    testName: string,
    headless: string,
    path?: string,
    measurementId?: string,
    credentials?: Credentials
  ) {
    // 3.1) inspect both dataLayer and the request sent to GA4
    const browser = await puppeteer.launch({
      headless: headless === 'new' ? 'new' : false,
      defaultViewport: null,
      ignoreHTTPSErrors: true,
      args: BROWSER_ARGS,
    });

    const [page] = await browser.pages();

    const result = await this.inspectorSingleEventService.inspectDataLayer(
      page,
      projectName,
      testName,
      headless,
      path,
      measurementId,
      credentials
    );

    // 3.2) construct the data to be written to the xlsx file
    const data = [
      {
        dataLayerResult: result.dataLayerCheckResult,
        rawRequest: result.rawRequest,
        requestCheckResult: result.requestCheckResult,
        destinationUrl: result.destinationUrl,
      },
    ];
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

    Logger.log('Single test is done!', 'WaiterService.inspectSingleEvent');

    // no need to close the browser since it has one page only and the page has been closed already
    Logger.log('Browser is closed!', 'WaiterService.inspectSingleEvent');
    return data;
  }
}
