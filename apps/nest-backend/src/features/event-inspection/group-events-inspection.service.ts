/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { Browser, Credentials, Page } from 'puppeteer';
import { getCurrentTimestamp } from '@utils';
import { InspectorGroupEventsService } from '../../features/inspector/inspector-group-events.service';
import { FileService } from '../../infrastructure/os/file/file.service';
import { ProjectAbstractReportService } from '../../features/project-agent/project-abstract-report/project-abstract-report.service';
import { ConfigsService } from '../../core/configs/configs.service';

@Injectable()
export class GroupEventsInspectionService {
  private readonly logger = new Logger(GroupEventsInspectionService.name);
  private abortController: AbortController | null = null;
  private currentBrowser: Browser | null = null;

  constructor(
    private readonly fileService: FileService,
    private readonly inspectorGroupEventsService: InspectorGroupEventsService,
    private readonly projectAbstractReportService: ProjectAbstractReportService,
    private readonly configsService: ConfigsService
  ) {}

  async inspectProject(
    projectName: string,
    headless: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    concurrency?: number
  ) {
    // 3.1) inspect both dataLayer and the request sent to GA4
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PCR = require('puppeteer-chromium-resolver');
    const options = {};
    const stats = await PCR(options);
    const browser = await stats.puppeteer.launch({
      headless: headless === 'true' ? true : false,
      defaultViewport: null,
      ignoreHTTPSErrors: true,
      args: this.configsService.getBROWSER_ARGS(),
      executablePath: stats.executablePath,
      signal: signal
    });

    // Set up an abort listener
    signal.addEventListener(
      'abort',
      async () => {
        try {
          await this.cleanup();
        } catch (error) {
          this.logger.error(`Error during cleanup: ${error}`);
        }
      },
      { once: true }
    );
    this.currentBrowser = browser;
    const result =
      await this.inspectorGroupEventsService.inspectProjectDataLayer(
        browser,
        projectName,
        measurementId,
        credentials,
        captureRequest,
        concurrency
      );

    // 3.2) construct the data to be written to the xlsx file
    const data = result.map((item) => {
      return {
        dataLayerResult: item.dataLayerCheckResult,
        requestCheckResult: item.requestCheckResult,
        rawRequest: item.rawRequest,
        destinationUrl: item.destinationUrl
      };
    });

    // 3.3) write the data to the xlsx file using cache file
    // the reason to use cache file is that there could be 20 tests running at the same time
    // one failed test will cause all other tests to fail in terms of test execution logic
    // therefore, we handle the result gathering logic in the xlsx-report.service.ts
    const timestamp = getCurrentTimestamp();

    const operations =
      await this.fileService.getOperationJsonByProject(projectName);
    // TODO: Prepare the data to be written to the xlsx file
    // Keep the original implementation for memory
    // await this.xlsxReportGroupEventsService.writeXlsxFileForAllTests(
    //   operations,
    //   `QA_report_all_.xlsx_${timestamp}.xlsx`,
    //   'Sheet1',
    //   projectName
    // );

    // TODO: 3.4 report to each test
    await this.projectAbstractReportService.writeProjectAbstractTestRsultJson(
      projectName,
      data.map((item) => item.dataLayerResult)
    );
    const pages = await browser.pages();
    await Promise.all(pages.map((page: Page) => page.close()));
    return data;
  }

  stopOperation() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async cleanup(): Promise<void> {
    if (this.currentBrowser) {
      await this.currentBrowser.close();
      this.currentBrowser = null;
    }
  }
}
