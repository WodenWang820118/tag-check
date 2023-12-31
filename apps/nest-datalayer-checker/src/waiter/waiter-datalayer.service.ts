import { Injectable, Logger } from '@nestjs/common';
import { GtmOperatorService } from '../gtm-operator/gtm-operator.service';
import { InspectorService } from '../inspector/inspector.service';
import { FileService } from '../os/file/file.service';
import { OsService } from '../os/os.service';
import { XlsxReportService } from '../os/xlsx-report/xlsx-report.service';
import puppeteer, { Credentials } from 'puppeteer';
import { getCurrentTimestamp } from './utils';

@Injectable()
export class WaiterDataLayerService {
  constructor(
    private osService: OsService,
    private fileService: FileService,
    private xlsxReportService: XlsxReportService,
    private inspectorService: InspectorService,
    private gtmOperatorService: GtmOperatorService
  ) {}

  // 3) inspect single operation/event
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
      args: [
        '--window-size=1440,900',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    const [page] = await browser.pages();

    const result = await this.inspectorService.inspectDataLayer(
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
    await this.xlsxReportService.writeXlsxFile(
      await this.fileService.getReportSavingFolder(projectName),
      `QA_report_single_${testName}_${timestamp}.xlsx`,
      'Sheet1',
      data,
      testName,
      projectName
    );

    Logger.log('Single test is done!', 'WaiterService.inspectSingleEvent');

    // no need to close the browser since it has one page only and the page has been closed already
    Logger.log('Browser is closed!', 'WaiterService.inspectSingleEvent');
    return data;
  }

  // 3) inspect all operations under a project
  async inspectProject(
    projectName: string,
    headless: string,
    path?: string,
    args?: string[],
    measurementId?: string,
    credentials?: Credentials,
    concurrency?: number
  ) {
    // 3.1) inspect both dataLayer and the request sent to GA4
    const browser = await puppeteer.launch({
      headless: headless === 'new' ? 'new' : false,
      defaultViewport: null,
      ignoreHTTPSErrors: true,
      args: [
        '--window-size=1440,900',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    const result = await this.inspectorService.inspectProjectDataLayer(
      browser,
      projectName,
      path,
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
    await this.osService.writeXlsxFileForAllTests(
      `QA_report_all_.xlsx_${timestamp}.xlsx`,
      'Sheet1',
      projectName
    );
    Logger.log('All tests are done!', 'WaiterService.inspectProject');
    Logger.log('Browser is closed!', 'WaiterService.inspectProject');
    return data;
  }
}
