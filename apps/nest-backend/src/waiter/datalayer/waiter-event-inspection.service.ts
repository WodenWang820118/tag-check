import { Injectable } from '@nestjs/common';
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
    measurementId?: string,
    credentials?: Credentials,
    eventInspectionPresetDto?: EventInspectionPresetDto
  ) {
    return await this.singleEventInspectionService.inspectSingleEvent(
      projectName,
      eventId,
      headless,
      measurementId,
      credentials,
      eventInspectionPresetDto
    );
  }

  async inspectProject(
    projectName: string,
    headless: string,
    measurementId?: string,
    credentials?: Credentials,
    concurrency?: number
  ) {
    return await this.groupEventsInspection.inspectProject(
      projectName,
      headless,
      measurementId,
      credentials,
      concurrency
    );
  }

  // TODO: might need to separate the cleanup logic
  stopOperation() {
    this.singleEventInspectionService.stopOperation();
    this.groupEventsInspection.stopOperation();
  }
}
