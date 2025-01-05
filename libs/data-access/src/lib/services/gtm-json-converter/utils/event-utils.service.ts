import { Injectable } from '@angular/core';
import {
  BUILT_IN_EVENTS,
  BUILT_IN_SCROLL_EVENT,
  BUILT_IN_VIDEO_EVENTS
} from '../transform/utils/constant';
import { DataLayer } from '@utils';

@Injectable({
  providedIn: 'root'
})
export class EventUtils {
  isBuiltInEvent(eventName: string): boolean {
    return BUILT_IN_EVENTS.some((_event) => eventName.includes(_event));
  }

  isIncludeVideo(dataLayers: DataLayer[]): boolean {
    return dataLayers.some((dL) => BUILT_IN_VIDEO_EVENTS.includes(dL.event));
  }

  isIncludeScroll(dataLayers: DataLayer[]): boolean {
    return dataLayers.some((dL) => BUILT_IN_SCROLL_EVENT.includes(dL.event));
  }
}
