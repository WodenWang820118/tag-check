import { Injectable } from '@nestjs/common';
import { SharedService } from '../shared/shared.service';
import { Credentials } from 'puppeteer';
import { InspectorService } from '../inspector/inspector.service';

@Injectable()
export class WaiterService {
  constructor(
    private sharedService: SharedService,
    private inspectorService: InspectorService
  ) {}

  // 1)
  selectRootProjectFolder(rootProjectPath: string) {
    this.sharedService.rootProjectFolder = rootProjectPath;
  }

  // 2) init project if not exists
  initProject(projectName: string) {
    this.sharedService.initProject(projectName);
  }

  // 2) select project if exists
  selectProject(projectName: string) {
    this.sharedService.projectFolder = projectName;
  }

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
    const result = await this.inspectorService.inspectDataLayer(
      projectName,
      testName,
      headless,
      path,
      measurementId,
      credentials
    );

    // 3.2) construct the data to be written to the xlsx file
    // TODO: how to include snapshots?
    const data = [
      {
        dataLayerResult: JSON.stringify(result.dataLayerCheckResult, null, 2),
        requestCheckResult: JSON.stringify(result.requestCheckResult, null, 2),
      },
    ];
    // 3.3) write the data to the xlsx file
    this.sharedService.writeXlsxFile(
      `${this.sharedService.getReportSavingFolder(projectName)}\\result.xlsx`,
      'Sheet1',
      data,
      testName,
      projectName
    );
  }
  // 3) inspect all operations under a project

  async inspectProject(
    projectName: string,
    headless: string,
    path?: string,
    measurementId?: string,
    credentials?: Credentials
  ) {
    // 3.1) inspect both dataLayer and the request sent to GA4
    const result = await this.inspectorService.inspectProjectDataLayer(
      projectName,
      headless,
      path,
      measurementId,
      credentials
    );

    // 3.2) construct the data to be written to the xlsx file
    const data = result.map((item) => {
      return {
        dataLayerResult: JSON.stringify(item.dataLayerCheckResult, null, 2),
        requestCheckResult: JSON.stringify(item.requestCheckResult, null, 2),
      };
    });

    console.log(data);

    // 3.3) write the data to the xlsx file
    this.sharedService.writeXlsxFile(
      `${this.sharedService.getReportSavingFolder(projectName)}\\result.xlsx`,
      'Sheet1',
      data,
      undefined,
      projectName
    );
  }
}
