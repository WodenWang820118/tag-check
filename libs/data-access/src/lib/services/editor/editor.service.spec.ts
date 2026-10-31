import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EditorTypeEnum } from '@utils';
import { EditorView } from 'codemirror';

import { EditorService, lintJsonUnlessBlank } from './editor.service';

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

  it('starts with empty input and sets placeholder on the empty input editor', () => {
    expect(service.contents$.inputJson()).toBe('');
    const host = document.createElement('div');
    service.initEditorView(EditorTypeEnum.INPUT_JSON, new ElementRef(host));

    expect(service.contents$.inputJson()).toBe('');
    expect(service.editor$.inputJson().state.doc.toString()).toBe('');
    expect(host.querySelector('.cm-placeholder')?.textContent).toBe(
      'Upload or write a measurement plan, or paste dataLayer specs as JSON'
    );
  });

  it('clears the output document and restores its placeholder when input is replaced', () => {
    const host = document.createElement('div');
    service.initEditorView(EditorTypeEnum.OUTPUT_JSON, new ElementRef(host));
    service.setContent(EditorTypeEnum.OUTPUT_JSON, '{"exportTime":"old"}');

    service.setContent(EditorTypeEnum.INPUT_JSON, '[{"event":"purchase"}]');

    expect(service.contents$.outputJson()).toBe('');
    expect(service.editor$.outputJson().state.doc.toString()).toBe('');
    expect(host.querySelector('.cm-placeholder')?.textContent).toBe(
      'Convert the input to see the GTM container here.'
    );
  });

  it('clears output even when a programmatic replacement has the same input text', () => {
    service.setContent(EditorTypeEnum.INPUT_JSON, '[{"event":"purchase"}]');
    service.setContent(EditorTypeEnum.OUTPUT_JSON, '{"exportTime":"old"}');

    service.setContent(EditorTypeEnum.INPUT_JSON, '[{"event":"purchase"}]');

    expect(service.contents$.outputJson()).toBe('');
  });

  it('clears output when the user edits the input document', () => {
    service.initEditorView(
      EditorTypeEnum.INPUT_JSON,
      new ElementRef(document.createElement('div')),
      '[]'
    );
    service.setContent(EditorTypeEnum.OUTPUT_JSON, '{"exportTime":"old"}');
    const editor = service.editor$.inputJson();

    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: '[{}]' }
    });

    expect(service.contents$.outputJson()).toBe('');
    expect(service.editor$.outputJson().state.doc.toString()).toBe('');
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

describe('lintJsonUnlessBlank', () => {
  const lint = (doc: string) => {
    const view = new EditorView({ doc });
    try {
      return lintJsonUnlessBlank(view);
    } finally {
      view.destroy();
    }
  };

  it('reports nothing for a blank document', () => {
    expect(lint('')).toEqual([]);
    expect(lint('  \n ')).toEqual([]);
  });

  it('reports invalid JSON', () => {
    expect(lint('[{"event": }]').length).toBeGreaterThan(0);
  });

  it('reports nothing for valid JSON', () => {
    expect(lint('[{"event": "purchase"}]')).toEqual([]);
  });
});
