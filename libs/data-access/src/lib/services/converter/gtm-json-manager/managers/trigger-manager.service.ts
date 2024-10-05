import { Trigger, TriggerConfig } from '@utils';
import { EventUtils } from '../../utils/event-utils.service';
import { Injectable } from '@angular/core';
import { EventTrigger } from '../triggers/event-trigger.service';
import { VideoTrigger } from '../triggers/video-trigger.service';
import { scrollTrigger } from '../triggers/scroll-trigger.service';

@Injectable({
  providedIn: 'root',
})
export class TriggerManager {
  constructor(
    private eventTrigger: EventTrigger,
    private videoTrigger: VideoTrigger,
    private scrollTrigger: scrollTrigger,
    private eventUtils: EventUtils
  ) {}
  triggers: Trigger[] = [];

  formatSingleTrigger(eventName: string) {
    if (this.eventUtils.isBuiltInEvent(eventName)) {
      return;
    }

    this.addTriggerIfNotExists(eventName);
  }

  addTriggerIfNotExists(eventName: string) {
    if (!this.triggers.some((trigger) => trigger.name === eventName)) {
      this.triggers.push({
        name: eventName,
        triggerId: (this.triggers.length + 1).toString(),
      });
    }
  }

  getTriggers() {
    return this.triggers;
  }

  getTriggerConfig(
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
