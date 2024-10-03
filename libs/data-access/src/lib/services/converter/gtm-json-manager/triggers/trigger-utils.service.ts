import { Trigger, TriggerConfig } from '@utils';
import { Injectable } from '@angular/core';
import { EventTrigger } from './event-trigger.service';
import { scrollTrigger } from './scroll-trigger.service';
import { VideoTrigger } from './video-trigger.service';

@Injectable({
  providedIn: 'root',
})
export class TriggerUtils {
  constructor(
    private eventTrigger: EventTrigger,
    private scrollTrigger: scrollTrigger,
    private videoTrigger: VideoTrigger
  ) {}
  getTriggers(
    accountId: string,
    containerId: string,
    data: Record<string, string>[],
    triggers: Trigger[]
  ): TriggerConfig[] {
    return [
      ...triggers.map(({ name: trigger }) => {
        return this.eventTrigger.createTrigger(accountId, containerId, trigger);
      }),
      ...this.videoTrigger.createVideoTrigger(accountId, containerId, data),
      ...this.scrollTrigger.createScrollTrigger(accountId, containerId, data),
    ].map((_trigger, index) => ({
      ..._trigger,
      triggerId: (index + 1).toString(),
    }));
  }
}
