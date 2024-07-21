import { Injectable, Logger } from '@nestjs/common';
import { Browser, Credentials } from 'puppeteer';
import { getCurrentTimestamp } from '@utils';
import { BROWSER_ARGS } from '../configs/project.config';
import { AbstractReportService } from '../os/abstract-report/abstract-report.service';
import { InspectorGroupEventsService } from '../inspector/inspector-group-events.service';
import { XlsxReportGroupEventsService } from '../os/xlsx-report/xlsx-report-group-events.service';
import { FileService } from '../os/file/file.service';

@Injectable()
export class GroupEventsInspectionService {
  private abortController: AbortController | null = null;
  private currentBrowser: Browser | null = null;

  constructor(
    private fileService: FileService,
    private xlsxReportGroupEventsService: XlsxReportGroupEventsService,
    private inspectorGroupEventsService: InspectorGroupEventsService,
    private abstractReportService: AbstractReportService
  ) {}

  async inspectProject(
    projectName: string,
    headless: string,
    measurementId?: string,
    credentials?: Credentials,
    concurrency?: number
  ) {
    // 3.1) inspect both dataLayer and the request sent to GA4
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PCR = require('puppeteer-chromium-resolver');
    const options = {};
    const stats = await PCR(options);
    Logger.log(
      stats,
      'WaiterDataLayerGroupEventsService.inspectProject: stats'
    );
    this.currentBrowser = await stats.puppeteer
      .launch({
        headless: headless === 'true' ? true : false,
        defaultViewport: null,
        ignoreHTTPSErrors: true,
        args: BROWSER_ARGS,
        executablePath: stats.executablePath,
        signal: signal,
      })
      .catch(function (error) {
        console.error(error);
      });

    // Set up an abort listener
    signal.addEventListener(
      'abort',
      async () => {
        await this.cleanup();
      },
      { once: true }
    );

    const result =
      await this.inspectorGroupEventsService.inspectProjectDataLayer(
        this.currentBrowser,
        projectName,
        headless,
        measurementId,
        credentials,
        concurrency
      );

    // 3.2) construct the data to be written to the xlsx file
    const data = result.map((item) => {
      return {
        dataLayerResult: item.dataLayerCheckResult,
        requestCheckResult: item.requestCheckResult,
        rawRequest: item.rawRequest,
        destinationUrl: item.destinationUrl,
      };
    });

    // 3.3) write the data to the xlsx file using cache file
    // the reason to use cache file is that there could be 20 tests running at the same time
    // one failed test will cause all other tests to fail in terms of test execution logic
    // therefore, we handle the result gathering logic in the xlsx-report.service.ts
    const timestamp = getCurrentTimestamp();

    const operations = await this.fileService.getOperationJsonByProject(
      projectName
    );
    await this.xlsxReportGroupEventsService.writeXlsxFileForAllTests(
      operations,
      `QA_report_all_.xlsx_${timestamp}.xlsx`,
      'Sheet1',
      projectName
    );

    // TODO: 3.4 report to each test
    await this.abstractReportService.writeProjectAbstractTestRsultJson(
      projectName,
      data.map((item) => item.dataLayerResult)
    );

    Logger.log('All tests are done!', 'WaiterService.inspectProject');
    Logger.log('Browser is closed!', 'WaiterService.inspectProject');
    return data;
  }

  stopOperation() {
    Logger.log('Operation stopped', 'waiter.inspectSingleEvent');
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async cleanup() {
    Logger.log('Cleaning up resources', 'waiter.inspectSingleEvent');
    if (this.currentBrowser) {
      await this.currentBrowser
        .close()
        .catch((err) => Logger.error(err, 'Error closing browser'));
      this.currentBrowser = null;
    }
  }
}
