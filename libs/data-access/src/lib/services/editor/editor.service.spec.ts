import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EditorTypeEnum } from '@utils';

import { EditorService } from './editor.service';

describe('EditorService', () => {
  let service: EditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditorService);
  });

  afterEach(() => {
    service.editor$.inputJson().destroy();
    service.editor$.outputJson().destroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('syncs input JSON content when the editor document changes', () => {
    const host = document.createElement('div');

    service.initEditorView(
      EditorTypeEnum.INPUT_JSON,
      new ElementRef(host),
      '[]'
    );

    expect(service.contents$.inputJson()).toBe('[]');

    const editor = service.editor$.inputJson();
    const content = '[{"event":"page_view"}]';

    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: content
      }
    });

    expect(service.contents$.inputJson()).toBe(content);
  });

  it('syncs output JSON content when the editor document changes', () => {
    const host = document.createElement('div');

    service.initEditorView(
      EditorTypeEnum.OUTPUT_JSON,
      new ElementRef(host),
      '{}'
    );

    const editor = service.editor$.outputJson();
    const content = '{"exportFormatVersion":2}';

    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: content
      }
    });

    expect(service.contents$.outputJson()).toBe(content);
  });

  it('syncs empty input when the editor document is cleared', () => {
    const host = document.createElement('div');

    service.initEditorView(
      EditorTypeEnum.INPUT_JSON,
      new ElementRef(host),
      '[{"event":"page_view"}]'
    );

    const editor = service.editor$.inputJson();

    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: ''
      }
    });

    expect(service.contents$.inputJson()).toBe('');
  });

  it('does not rewrite content for transactions without document changes', () => {
    const host = document.createElement('div');

    service.initEditorView(
      EditorTypeEnum.INPUT_JSON,
      new ElementRef(host),
      '[{"event":"page_view"}]'
    );

    const editor = service.editor$.inputJson();

    service.setContent(EditorTypeEnum.INPUT_JSON, '[{"event":"purchase"}]');
    editor.dispatch({});

    expect(service.contents$.inputJson()).toBe('[{"event":"purchase"}]');
  });

  it('keeps setContent synchronized with the current editor document', () => {
    const host = document.createElement('div');

    service.initEditorView(
      EditorTypeEnum.INPUT_JSON,
      new ElementRef(host),
      '[]'
    );

    const content = '[{"event":"add_to_cart"}]';

    service.setContent(EditorTypeEnum.INPUT_JSON, content);

    expect(service.contents$.inputJson()).toBe(content);
    expect(service.editor$.inputJson().state.doc.toString()).toBe(content);
  });
});
