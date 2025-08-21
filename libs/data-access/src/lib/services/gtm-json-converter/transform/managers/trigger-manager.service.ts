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
    private readonly eventTrigger: EventTrigger,
    private readonly videoTrigger: VideoTrigger,
    private readonly scrollTrigger: ScrollTrigger
  ) {}

  createTriggers(dataLayer: DataLayer[]): Trigger[] {
    const triggers = this.buildSimpleTriggers(dataLayer);
    return this.assignTriggerIds(triggers) as Trigger[];
  }

  getTriggers(
    accountId: string,
    containerId: string,
    dataLayer: DataLayer[]
  ): TriggerConfig[] {
    const triggers = this.buildAllTriggers(accountId, containerId, dataLayer);
    return this.assignTriggerIds(triggers) as TriggerConfig[];
  }

  // Private helper to build simple triggers without IDs
  private buildSimpleTriggers(
    dataLayer: DataLayer[]
  ): Array<Omit<Trigger, 'triggerId'>> {
    return dataLayer.map(({ event }) => ({ name: event }));
  }

  // Private helper to build all trigger configs
  private buildAllTriggers(
    accountId: string,
    containerId: string,
    dataLayer: DataLayer[]
  ): TriggerConfig[] {
    const eventTriggers = dataLayer.map(({ event }) =>
      this.eventTrigger.createTrigger(accountId, containerId, event)
    );
    const videoTriggers = this.videoTrigger.createVideoTrigger(
      accountId,
      containerId
    );
    const scrollTriggers = this.scrollTrigger.createScrollTrigger(
      accountId,
      containerId
    );
    return [...eventTriggers, ...videoTriggers, ...scrollTriggers];
  }

  // Private helper to assign sequential IDs to triggers
  private assignTriggerIds<T>(triggers: T[]): Array<T & { triggerId: string }> {
    return triggers.map(
      (trigger, idx) =>
        ({
          ...trigger,
          triggerId: String(idx + 1)
        }) as T & { triggerId: string }
    );
  }
}
