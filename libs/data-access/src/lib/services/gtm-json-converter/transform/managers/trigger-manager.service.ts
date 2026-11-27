import { DataLayer, Trigger, TriggerConfig } from '@utils';
import { Injectable } from '@angular/core';
import { EventTrigger } from '../triggers/event-trigger.service';
import { VideoTrigger } from '../triggers/video-trigger.service';
import { ScrollTrigger } from '../triggers/scroll-trigger.service';
import { EventUtils } from '../../utils/event-utils.service';
import { SCROLL_TRIGGER_NAME, VIDEO_TRIGGER_NAME } from '../utils/constant';

interface TriggerContribution {
  names: (dataLayers: DataLayer[]) => string[];
  configs: (
    accountId: string,
    containerId: string,
    dataLayers: DataLayer[]
  ) => TriggerConfig[];
}

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
   *
   * Custom-event references retain raw event names because tag matching uses
   * those names.
   */
  createTriggers(dataLayer: DataLayer[]): Trigger[] {
    const names = this.getTriggerContributions().flatMap((contribution) =>
      contribution.names(dataLayer)
    );
    return this.assignTriggerIds(names.map((name) => ({ name })));
  }

  /** The trigger configurations of the container, with their IDs. */
  getTriggers(
    accountId: string,
    containerId: string,
    dataLayer: DataLayer[]
  ): TriggerConfig[] {
    const configs = this.getTriggerContributions().flatMap((contribution) =>
      contribution.configs(accountId, containerId, dataLayer)
    );
    return this.assignTriggerIds(configs);
  }

  /**
   * Keep contribution order shared because generated tag references depend on
   * positional trigger IDs.
   */
  private getTriggerContributions(): TriggerContribution[] {
    return [
      {
        names: (dataLayers) => this.getCustomEvents(dataLayers),
        configs: (accountId, containerId, dataLayers) =>
          this.getCustomEvents(dataLayers).map((event) =>
            this.eventTrigger.createTrigger(accountId, containerId, event)
          )
      },
      {
        names: (dataLayers) =>
          this.eventUtils.isIncludeVideo(dataLayers)
            ? [VIDEO_TRIGGER_NAME]
            : [],
        configs: (accountId, containerId, dataLayers) =>
          this.videoTrigger.createVideoTrigger(
            accountId,
            containerId,
            dataLayers
          )
      },
      {
        names: (dataLayers) =>
          this.eventUtils.isIncludeScroll(dataLayers)
            ? [SCROLL_TRIGGER_NAME]
            : [],
        configs: (accountId, containerId, dataLayers) =>
          this.scrollTrigger.createScrollTrigger(
            accountId,
            containerId,
            dataLayers
          )
      }
    ];
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
