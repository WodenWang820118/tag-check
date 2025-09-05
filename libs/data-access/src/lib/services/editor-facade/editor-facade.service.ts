/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { EditorService } from '../editor/editor.service';
import { EditorTypeEnum } from '@utils';

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
    return json.some(
      (item: any) =>
        item.event === 'video_start' ||
        item.event === 'video_progress' ||
        item.event === 'video_complete'
    );
  }

  hasScrollTag(json: any) {
    if (!Array.isArray(json)) return false;
    return json.some((item: any) => item.event === 'scroll');
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
      includeVideoTag: ['video_start', 'video_progress', 'video_completion'],
      includeScrollTag: ['scroll']
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
    eventNames: string[]
  ) {
    eventNames.forEach((eventName) => {
      const eventIndex = json.findIndex(
        (item: any) => item.event === eventName
      );

      if (shouldInclude && eventIndex === -1) {
        json.push({ event: eventName });
      } else if (!shouldInclude && eventIndex !== -1) {
        json.splice(eventIndex, 1);
      }
    });
    return json;
  }
}
