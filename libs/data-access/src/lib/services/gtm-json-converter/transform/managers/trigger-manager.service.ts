import { DataLayer, Trigger, TriggerConfig } from '@utils';
import { Injectable } from '@angular/core';
import { EventTrigger } from '../triggers/event-trigger.service';
import { VideoTrigger } from '../triggers/video-trigger.service';
import { ScrollTrigger } from '../triggers/scroll-trigger.service';

@Injectable({
  providedIn: 'root'
})
export class TriggerManager {
  constructor(
    private eventTrigger: EventTrigger,
    private videoTrigger: VideoTrigger,
    private scrollTrigger: ScrollTrigger
  ) {}

  createTriggers(dataLayer: DataLayer[]): Trigger[] {
    const results = dataLayer.map(({ event }, index) => {
      return {
        name: event,
        triggerId: (index + 1).toString()
      };
    });
    return results;
  }

  getTriggers(
    accountId: string,
    containerId: string,
    dataLayer: DataLayer[]
  ): TriggerConfig[] {
    const results = [
      ...dataLayer.map(({ event }) => {
        return this.eventTrigger.createTrigger(accountId, containerId, event);
      }),
      ...this.videoTrigger.createVideoTrigger(accountId, containerId),
      ...this.scrollTrigger.createScrollTrigger(accountId, containerId)
    ].map((_trigger, index) => ({
      ..._trigger,
      triggerId: (index + 1).toString()
    }));
    console.log('triggers: ', results);
    return results;
  }
}
