import { Injectable, Logger } from '@nestjs/common';
import { SingleEventInspectionService } from '../../features/event-inspection/single-event-inspection.service';
import { GroupEventsInspectionService } from '../../features/event-inspection/group-events-inspection.service';
import { Credentials } from 'puppeteer';
import {
  CookieData,
  EventInspectionPresetDto,
  LocalStorage,
  LocalStorageData
} from '@utils';
import { InspectEventQueryDto } from './dto/inspect-event-query.dto';

@Injectable()
export class EventInspectionControllerService {
  private readonly logger = new Logger(EventInspectionControllerService.name);
  constructor(
    private readonly singleEventInspectionService: SingleEventInspectionService,
    private readonly groupEventsInspection: GroupEventsInspectionService
  ) {}

  async inspectSingleEvent(
    projectName: string,
    eventId: string,
    query: InspectEventQueryDto,
    eventInspectionPresetDto?: EventInspectionPresetDto
  ) {
    return await this.singleEventInspectionService.inspectSingleEvent(
      projectName,
      eventId,
      query.headless || 'false',
      query.measurementId || '',
      { username: query.username || '', password: query.password || '' },
      query.captureRequest || 'false',
      eventInspectionPresetDto || {
        application: {
          localStorage: { data: [] as LocalStorageData[] },
          cookie: { data: [] as CookieData[] }
        },
        puppeteerArgs: []
      }
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
    this.logger.log('Stopping the operation');
    // Wait for a short time to ensure the operation has started
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.singleEventInspectionService.abort();
    this.groupEventsInspection.stopOperation();
  }
}
