/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { EditorService } from '../editor/editor.service';
import { EditorTypeEnum } from '@utils';
import {
  BUILT_IN_SCROLL_EVENT,
  BUILT_IN_VIDEO_EVENTS
} from '../gtm-json-converter/transform/utils/constant';

@Injectable({
  providedIn: 'root'
})
export class EditorFacadeService {
  constructor(private readonly editorService: EditorService) {}

  set inputJsonContent(json: any) {
    console.log('Setting input JSON content:', json);
    this.editorService.setContent(
      EditorTypeEnum.INPUT_JSON,
      JSON.stringify(json, null, 2)
    );
  }

  get inputJsonContent() {
    return this.editorService.contents$.inputJson;
  }

  set outputJsonContent(json: any) {
    this.editorService.setContent(
      EditorTypeEnum.OUTPUT_JSON,
      JSON.stringify(json, null, 2)
    );
  }

  get editorView() {
    return this.editorService.editor$;
  }

  hasVideoTag(json: any) {
    if (!Array.isArray(json)) return false;
    return json.some((item: any) => BUILT_IN_VIDEO_EVENTS.includes(item.event));
  }

  hasScrollTag(json: any) {
    if (!Array.isArray(json)) return false;
    return json.some((item: any) => BUILT_IN_SCROLL_EVENT.includes(item.event));
  }

  updateJsonBasedOnForm(
    json: any,
    form: {
      includeVideoTag: boolean;
      includeScrollTag: boolean;
      includeItemScopedVariables: boolean;
    }
  ): any {
    // Configuration object to map form properties to their respective events
    const eventConfig = {
      includeVideoTag: BUILT_IN_VIDEO_EVENTS as readonly string[],
      includeScrollTag: BUILT_IN_SCROLL_EVENT as readonly string[]
      // more mappings can be added here in the future...
    };

    return Object.keys(eventConfig).reduce((updatedJson, formKey) => {
      const shouldInclude = form[formKey as keyof typeof form];
      const events = eventConfig[formKey as keyof typeof eventConfig];
      return this.updateJsonForEvents(updatedJson, shouldInclude, events);
    }, json);
  }

  updateJsonForEvents(
    json: any[],
    shouldInclude: boolean,
    eventNames: ReadonlyArray<string>
  ) {
    for (const eventName of eventNames) {
      const eventIndex = json.findIndex(
        (item: any) => item.event === eventName
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
