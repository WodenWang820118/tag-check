import { Injectable } from '@nestjs/common';
import { GtmOperatorService } from '../../gtm-operator/gtm-operator.service';
import { Credentials } from 'puppeteer';

@Injectable()
export class WaiterGtmOperatorService {
  constructor(private gtmOperatorService: GtmOperatorService) {}
  async inspectSingleEventViaGtm(
    gtmUrl: string,
    projectName: string,
    testName: string,
    headless: string,
    filePath?: string,
    credentials?: Credentials
  ) {
    await this.gtmOperatorService.inspectSingleEventViaGtm(
      gtmUrl,
      projectName,
      testName,
      headless,
      filePath,
      credentials
    );
  }
}
