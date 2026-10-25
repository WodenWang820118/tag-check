import { Injectable, Logger } from '@nestjs/common';
import { SingleEventInspectionService } from '../../features/event-inspection/single-event-inspection.service';
import { CookieData, EventInspectionPresetDto, LocalStorageData } from '@utils';
import { InspectEventQueryDto } from './dto/inspect-event-query.dto';

/**
 * Turns a run request's query string and body into the options of a
 * single-event inspection, and aborts the running one.
 */
@Injectable()
export class EventInspectionControllerService {
  private readonly logger = new Logger(EventInspectionControllerService.name);
  constructor(
    private readonly singleEventInspectionService: SingleEventInspectionService
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
      {
        headless: query.headless || 'false',
        measurementId: query.measurementId || '',
        credentials: {
          username: query.username || '',
          password: query.password || ''
        },
        captureRequest: query.captureRequest || 'false',
        url: query.url,
        eventInspectionPresetDto: eventInspectionPresetDto || {
          application: {
            localStorage: { data: [] as LocalStorageData[] },
            cookie: { data: [] as CookieData[] }
          },
          puppeteerArgs: []
        }
      }
    );
  }

  async stopOperation() {
    this.logger.log('Stopping the operation');
    // Wait for a short time to ensure the operation has started
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.singleEventInspectionService.abort();
  }
}
