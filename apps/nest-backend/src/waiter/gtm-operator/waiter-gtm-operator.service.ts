import { Injectable, Logger } from '@nestjs/common';
import { GtmOperatorService } from '../../gtm-operator/gtm-operator.service';
import { Credentials } from 'puppeteer';
import { EventInspectionPresetDto } from '../../dto/event-inspection-preset.dto';

@Injectable()
export class WaiterGtmOperatorService {
  constructor(private gtmOperatorService: GtmOperatorService) {}
  async inspectSingleEventViaGtm(
    gtmUrl: string,
    projectName: string,
    testName: string,
    headless: string,
    measurementId?: string,
    credentials?: Credentials,
    eventInspectionPresetDto?: EventInspectionPresetDto
  ) {
    return await this.gtmOperatorService.inspectSingleEventViaGtm(
      gtmUrl,
      projectName,
      testName,
      headless,
      measurementId,
      credentials,
      eventInspectionPresetDto
    );
  }

  stopOperation() {
    Logger.log('Operation stopped', 'WaiterGtmOperatorService');
    return this.gtmOperatorService.stopOperation();
  }
}
