import { Injectable } from '@angular/core';
import { EditorService } from '../editor/editor.service';

@Injectable({
  providedIn: 'root',
})
export class EditorFacadeService {
  constructor(private editorService: EditorService) {}

  setInputJsonContent(json: any): void {
    this.editorService.setContent('inputJson', JSON.stringify(json, null, 2));
  }

  setOutputJsonContent(json: any): void {
    this.editorService.setContent('outputJson', JSON.stringify(json, null, 2));
  }

  getEditorView() {
    return this.editorService.editor$;
  }

  getInputJsonContent() {
    return this.editorService.editor$.inputJson;
  }

  hasVideoTag(json: any) {
    return json.some(
      (item: any) =>
        item.event === 'video_start' ||
        item.event === 'video_progress' ||
        item.event === 'video_complete'
    );
  }

  hasScrollTag(json: any) {
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
      includeScrollTag: ['scroll'],
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
