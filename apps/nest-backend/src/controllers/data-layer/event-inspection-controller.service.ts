import { Injectable, Logger } from '@nestjs/common';
import { SingleEventInspectionService } from '../../features/event-inspection/single-event-inspection.service';
import { EventInspectionPresetDto } from '@utils';
import { InspectEventQueryDto } from './dto/inspect-event-query.dto';
import { buildDirectRunOptions } from '../../features/test-run/run-options';
import { isQueryFlagOn } from '../../shared/query-flag';

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
      buildDirectRunOptions({
        headless: isQueryFlagOn(query.headless),
        measurementId: query.measurementId,
        username: query.username,
        password: query.password,
        captureRequest: isQueryFlagOn(query.captureRequest),
        url: query.url,
        preset: eventInspectionPresetDto
      })
    );
  }

  async stopOperation() {
    this.logger.log('Stopping the operation');
    // Wait for a short time to ensure the operation has started
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.singleEventInspectionService.abort();
  }
}
