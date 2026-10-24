import { Controller, MessageEvent, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ProgressEventsService } from '../../core/events-gateway/progress-events.service';

/** Streams run progress to the frontend over server-sent events (GET /events). */
@Controller()
export class EventsController {
  constructor(private readonly progressEventsService: ProgressEventsService) {}

  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.progressEventsService.events$;
  }
}
