import { DataLayer, Trigger, TriggerConfig } from '@utils';
import { Injectable } from '@angular/core';
import { EventTrigger } from '../triggers/event-trigger.service';
import { VideoTrigger } from '../triggers/video-trigger.service';
import { ScrollTrigger } from '../triggers/scroll-trigger.service';
import { EventUtils } from '../../utils/event-utils.service';
import { SCROLL_TRIGGER_NAME, VIDEO_TRIGGER_NAME } from '../utils/constant';

/**
 * Builds the container's triggers: one Custom Event trigger per custom data
 * layer event, then a YouTube Video trigger and a Scroll Depth trigger when
 * the specs ask for them. Trigger IDs are positions in that order, starting
 * at "1".
 */
@Injectable({
  providedIn: 'root'
})
export class TriggerManager {
  constructor(
    private readonly eventTrigger: EventTrigger,
    private readonly videoTrigger: VideoTrigger,
    private readonly scrollTrigger: ScrollTrigger,
    private readonly eventUtils: EventUtils
  ) {}

  /**
   * The name and ID of every trigger {@link getTriggers} creates, for tags to
   * reference. Custom Event triggers are named after their event; the
   * built-in triggers keep their own names (`event youtube video`,
   * `event scroll`).
   */
  createTriggers(dataLayer: DataLayer[]): Trigger[] {
    const names = [
      ...this.getCustomEvents(dataLayer),
      ...(this.eventUtils.isIncludeVideo(dataLayer)
        ? [VIDEO_TRIGGER_NAME]
        : []),
      ...(this.eventUtils.isIncludeScroll(dataLayer)
        ? [SCROLL_TRIGGER_NAME]
        : [])
    ];
    return this.assignTriggerIds(names.map((name) => ({ name })));
  }

  /** The trigger configurations of the container, with their IDs. */
  getTriggers(
    accountId: string,
    containerId: string,
    dataLayer: DataLayer[]
  ): TriggerConfig[] {
    const eventTriggers = this.getCustomEvents(dataLayer).map((event) =>
      this.eventTrigger.createTrigger(accountId, containerId, event)
    );
    const videoTriggers = this.videoTrigger.createVideoTrigger(
      accountId,
      containerId,
      dataLayer
    );
    const scrollTriggers = this.scrollTrigger.createScrollTrigger(
      accountId,
      containerId,
      dataLayer
    );
    return this.assignTriggerIds([
      ...eventTriggers,
      ...videoTriggers,
      ...scrollTriggers
    ]);
  }

  /**
   * Events that need a Custom Event trigger. Scroll and video events are
   * left out: Tag Manager's Scroll Depth and YouTube Video triggers fire
   * those tags, and sites do not push such events themselves.
   */
  private getCustomEvents(dataLayer: DataLayer[]): string[] {
    return dataLayer
      .map(({ event }) => event)
      .filter((event) => !this.eventUtils.isBuiltInEvent(event));
  }

  private assignTriggerIds<T>(triggers: T[]): Array<T & { triggerId: string }> {
    return triggers.map((trigger, idx) => ({
      ...trigger,
      triggerId: String(idx + 1)
    }));
  }
}
