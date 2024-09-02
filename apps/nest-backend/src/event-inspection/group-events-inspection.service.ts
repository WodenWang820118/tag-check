/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { Browser, Credentials } from 'puppeteer';
import { getCurrentTimestamp } from '@utils';
import { BROWSER_ARGS } from '../configs/project.config';
import { InspectorGroupEventsService } from '../inspector/inspector-group-events.service';
import { XlsxReportGroupEventsService } from '../os/xlsx-report/xlsx-report-group-events.service';
import { FileService } from '../os/file/file.service';
import { ProjectAbstractReportService } from '../project-agent/project-abstract-report/project-abstract-report.service';

@Injectable()
export class GroupEventsInspectionService {
  private abortController: AbortController | null = null;
  private currentBrowser: Browser | null = null;

  constructor(
    private fileService: FileService,
    private xlsxReportGroupEventsService: XlsxReportGroupEventsService,
    private inspectorGroupEventsService: InspectorGroupEventsService,
    private projectAbstractReportService: ProjectAbstractReportService
  ) {}

  async inspectProject(
    projectName: string,
    headless: string,
    measurementId: string,
    credentials: Credentials,
    concurrency?: number
  ) {
    // 3.1) inspect both dataLayer and the request sent to GA4
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PCR = require('puppeteer-chromium-resolver');
    const options = {};
    const stats = await PCR(options);
    const browser = await stats.puppeteer
      .launch({
        headless: headless === 'true' ? true : false,
        defaultViewport: null,
        ignoreHTTPSErrors: true,
        args: BROWSER_ARGS,
        executablePath: stats.executablePath,
        signal: signal,
      })
      .catch(function (error: any) {
        console.error(error);
      });

    // Set up an abort listener
    signal.addEventListener(
      'abort',
      async () => {
        try {
          await this.cleanup();
        } catch (error) {
          Logger.error(
            `Error during cleanup: ${String(error)}`,
            `${GroupEventsInspectionService.name}.${GroupEventsInspectionService.prototype.inspectProject.name}`
          );
        }
      },
      { once: true }
    );
    this.currentBrowser = browser;
    const result =
      await this.inspectorGroupEventsService.inspectProjectDataLayer(
        browser,
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
    await this.projectAbstractReportService.writeProjectAbstractTestRsultJson(
      projectName,
      data.map((item) => item.dataLayerResult)
    );

    Logger.log(
      'All tests are done!',
      `${GroupEventsInspectionService.name}.${GroupEventsInspectionService.prototype.inspectProject.name}`
    );
    Logger.log(
      'Browser is closed!',
      `${GroupEventsInspectionService.name}.${GroupEventsInspectionService.prototype.inspectProject.name}`
    );
    return data;
  }

  stopOperation() {
    Logger.log(
      'Operation stopped',
      `${GroupEventsInspectionService.name}.${GroupEventsInspectionService.prototype.stopOperation.name}`
    );
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async cleanup(): Promise<void> {
    Logger.log(
      'Cleaning up resources',
      `${GroupEventsInspectionService.name}.${GroupEventsInspectionService.prototype.cleanup.name}`
    );
    if (this.currentBrowser) {
      try {
        await this.currentBrowser.close();
      } catch (err) {
        Logger.error(
          err,
          `${GroupEventsInspectionService.name}.${GroupEventsInspectionService.prototype.cleanup.name}`
        );
      }
      this.currentBrowser = null;
    }
  }
}
