import { Injectable } from '@angular/core';
import {
  BUILT_IN_EVENTS,
  BUILT_IN_SCROLL_EVENT,
  BUILT_IN_VIDEO_EVENTS
} from '../transform/utils/constant';
import { DataLayer } from '@utils';

/**
 * Tells the built-in events (scroll and YouTube video), which get Tag
 * Manager's own triggers and tags, apart from custom data layer events.
 */
@Injectable({
  providedIn: 'root'
})
export class EventUtils {
  /** Whether the event is one of the built-in scroll or video events. */
  isBuiltInEvent(eventName: string): boolean {
    return BUILT_IN_EVENTS.includes(eventName);
  }

  /** Whether any data layer event asks for the YouTube video setup. */
  isIncludeVideo(dataLayers: DataLayer[]): boolean {
    return dataLayers.some((dL) => BUILT_IN_VIDEO_EVENTS.includes(dL.event));
  }

  /** Whether any data layer event asks for the scroll depth setup. */
  isIncludeScroll(dataLayers: DataLayer[]): boolean {
    return dataLayers.some((dL) => BUILT_IN_SCROLL_EVENT.includes(dL.event));
  }
}
