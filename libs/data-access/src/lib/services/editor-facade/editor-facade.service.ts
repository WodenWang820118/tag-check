import { Injectable, Signal } from '@angular/core';
import { EditorService } from '../editor/editor.service';
import { EditorTypeEnum } from '@utils';
import {
  BUILT_IN_SCROLL_EVENT,
  BUILT_IN_VIDEO_EVENTS
} from '../gtm-json-converter/transform/utils/constant';

/** The advanced options of tag-build that add or remove built-in events. */
export interface BuiltInEventOptions {
  includeVideoTag: boolean;
  includeScrollTag: boolean;
  includeItemScopedVariables: boolean;
}

function hasEvent(json: unknown, eventNames: readonly string[]): boolean {
  return (
    Array.isArray(json) &&
    json.some((item: unknown) => eventNames.includes(getEventName(item) ?? ''))
  );
}

function getEventName(item: unknown): string | undefined {
  if (typeof item !== 'object' || item === null || !('event' in item)) {
    return undefined;
  }
  return typeof item.event === 'string' ? item.event : undefined;
}

/**
 * tag-build's access to its two JSON editors: the input specs and the
 * converted GTM container. Also adds or removes the built-in scroll and
 * video events in the input specs to match the advanced options.
 */
@Injectable({
  providedIn: 'root'
})
export class EditorFacadeService {
  constructor(private readonly editorService: EditorService) {}

  /** Shows a value in the input editor as indented JSON. */
  set inputJsonContent(json: unknown) {
    this.editorService.setContent(
      EditorTypeEnum.INPUT_JSON,
      JSON.stringify(json, null, 2)
    );
  }

  /** The input editor's current text, as a signal. */
  get inputJsonContent(): Signal<string> {
    return this.editorService.contents$.inputJson;
  }

  /** Shows a value in the output editor as indented JSON. */
  set outputJsonContent(json: unknown) {
    this.editorService.setContent(
      EditorTypeEnum.OUTPUT_JSON,
      JSON.stringify(json, null, 2)
    );
  }

  /** The current output text, empty when the input has changed. */
  get outputJsonContent(): Signal<string> {
    return this.editorService.contents$.outputJson;
  }

  get editorView() {
    return this.editorService.editor$;
  }

  /** Whether parsed specs contain a video event; false for anything but an array. */
  hasVideoTag(json: unknown): boolean {
    return hasEvent(json, BUILT_IN_VIDEO_EVENTS);
  }

  /** Whether parsed specs contain the scroll event; false for anything but an array. */
  hasScrollTag(json: unknown): boolean {
    return hasEvent(json, BUILT_IN_SCROLL_EVENT);
  }

  /**
   * Adds the scroll and video events the options include, and removes those
   * they exclude, in place. Specs that are not an array, such as a single
   * event object, are returned unchanged.
   */
  updateJsonBasedOnForm<T>(json: T, form: BuiltInEventOptions): T {
    if (!Array.isArray(json)) {
      return json;
    }
    this.updateJsonForEvents(json, form.includeVideoTag, BUILT_IN_VIDEO_EVENTS);
    this.updateJsonForEvents(
      json,
      form.includeScrollTag,
      BUILT_IN_SCROLL_EVENT
    );
    return json;
  }

  /**
   * Pushes `{ event }` for each missing event when `shouldInclude` is true,
   * or removes the first spec of each event when it is false. Mutates and
   * returns `json`.
   */
  updateJsonForEvents(
    json: unknown[],
    shouldInclude: boolean,
    eventNames: ReadonlyArray<string>
  ): unknown[] {
    for (const eventName of eventNames) {
      const eventIndex = json.findIndex(
        (item) => getEventName(item) === eventName
      );

      if (shouldInclude && eventIndex === -1) {
        json.push({ event: eventName });
      } else if (!shouldInclude && eventIndex !== -1) {
        json.splice(eventIndex, 1);
      }
    }
    return json;
  }
}
