import { Injectable, Logger } from '@nestjs/common';
import { SingleEventInspectionService } from '../../event-inspection/single-event-inspection.service';
import { GroupEventsInspectionService } from '../../event-inspection/group-events-inspection.service';
import { Credentials } from 'puppeteer';
import { EventInspectionPresetDto } from '@utils';

@Injectable()
export class WaiterEventInspectionService {
  constructor(
    private singleEventInspectionService: SingleEventInspectionService,
    private groupEventsInspection: GroupEventsInspectionService
  ) {}

  async inspectSingleEvent(
    projectName: string,
    eventId: string,
    headless: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    eventInspectionPresetDto: EventInspectionPresetDto
  ) {
    return await this.singleEventInspectionService.inspectSingleEvent(
      projectName,
      eventId,
      headless,
      measurementId,
      credentials,
      captureRequest,
      eventInspectionPresetDto
    );
  }

  async inspectProject(
    projectName: string,
    headless: string,
    measurementId: string,
    credentials: Credentials,
    captureRequest: string,
    concurrency?: number
  ) {
    return await this.groupEventsInspection.inspectProject(
      projectName,
      headless,
      measurementId,
      credentials,
      captureRequest,
      concurrency
    );
  }

  // TODO: might need to separate the cleanup logic
  async stopOperation() {
    Logger.log(
      'Stopping the operation',
      `${WaiterEventInspectionService.name}.${this.stopOperation.name}`
    );
    // Wait for a short time to ensure the operation has started
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.singleEventInspectionService.abort();
    this.groupEventsInspection.stopOperation();
  }
}
