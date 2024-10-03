import { Injectable } from '@angular/core';
import {
  BUILT_IN_EVENTS,
  BUILT_IN_SCROLL_EVENT,
  BUILT_IN_VIDEO_EVENTS,
} from '../gtm-json-manager/constant';

@Injectable({
  providedIn: 'root',
})
export class EventUtils {
  isBuiltInEvent(eventName: string): boolean {
    return BUILT_IN_EVENTS.some((_event) => eventName.includes(_event));
  }

  isIncludeVideo(data: Record<string, string>[]): boolean {
    return data.some((record) =>
      BUILT_IN_VIDEO_EVENTS.includes(record['eventName'])
    );
  }

  isIncludeScroll(data: Record<string, string>[]): boolean {
    return data.some((record) =>
      BUILT_IN_SCROLL_EVENT.includes(record['eventName'])
    );
  }
}
