import { Injectable, Logger } from '@nestjs/common';
import { InspectorGroupEventsService } from '../../inspector/inspector-group-events.service';
import { XlsxReportGroupEventsService } from '../../os/xlsx-report/xlsx-report-group-events.service';
import puppeteer, { Credentials } from 'puppeteer';
import { getCurrentTimestamp } from '../utils';
import { FileService } from '../../os/file/file.service';
import { AbstractDatalayerReportService } from '../../os/abstract-datalayer-report/abstract-datalayer-report.service';
import { BROWSER_ARGS } from '../../configs/project.config';

@Injectable()
export class WaiterDataLayerGroupEventsService {
  constructor(
    private fileService: FileService,
    private xlsxReportGroupEventsService: XlsxReportGroupEventsService,
    private inspectorGroupEventsService: InspectorGroupEventsService,
    private abstractDatalayerReportService: AbstractDatalayerReportService
  ) {}

  async inspectProject(
    projectName: string,
    headless: string,
    path?: string,
    measurementId?: string,
    credentials?: Credentials,
    concurrency?: number
  ) {
    // 3.1) inspect both dataLayer and the request sent to GA4
    const browser = await puppeteer.launch({
      headless: headless === 'true' ? true : false,
      defaultViewport: null,
      ignoreHTTPSErrors: true,
      args: BROWSER_ARGS,
    });

    const result =
      await this.inspectorGroupEventsService.inspectProjectDataLayer(
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
    await this.abstractDatalayerReportService.writeProjectAbstractTestRsultJson(
      projectName,
      data.map((item) => item.dataLayerResult)
    );

    Logger.log('All tests are done!', 'WaiterService.inspectProject');
    Logger.log('Browser is closed!', 'WaiterService.inspectProject');
    return data;
  }
}
