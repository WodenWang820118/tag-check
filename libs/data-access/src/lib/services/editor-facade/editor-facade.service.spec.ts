import { TestBed } from '@angular/core/testing';
import { EditorTypeEnum } from '@utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorService } from '../editor/editor.service';
import { EditorFacadeService } from './editor-facade.service';

describe('EditorFacadeService', () => {
  let facade: EditorFacadeService;
  let editor: {
    setContent: ReturnType<typeof vi.fn>;
    contents$: { inputJson: string; outputJson: string };
    editor$: unknown;
  };

  beforeEach(() => {
    editor = {
      setContent: vi.fn(),
      contents$: { inputJson: 'current input', outputJson: 'current output' },
      editor$: { fake: true }
    };
    TestBed.configureTestingModule({
      providers: [
        EditorFacadeService,
        { provide: EditorService, useValue: editor }
      ]
    });
    facade = TestBed.inject(EditorFacadeService);
  });

  it('setting inputJsonContent serializes JSON and forwards it to the editor service', () => {
    facade.inputJsonContent = { foo: 'bar' };
    expect(editor.setContent).toHaveBeenCalledWith(
      EditorTypeEnum.INPUT_JSON,
      JSON.stringify({ foo: 'bar' }, null, 2)
    );
  });

  it('reading inputJsonContent returns the editor service inputJson value', () => {
    expect(facade.inputJsonContent).toBe('current input');
  });

  it('setting outputJsonContent serializes JSON and forwards it to the editor service', () => {
    facade.outputJsonContent = [1, 2, 3];
    expect(editor.setContent).toHaveBeenCalledWith(
      EditorTypeEnum.OUTPUT_JSON,
      JSON.stringify([1, 2, 3], null, 2)
    );
  });

  it('exposes the editor service editor$ via editorView', () => {
    expect(facade.editorView).toBe(editor.editor$);
  });

  it('hasVideoTag returns false for non-arrays and detects built-in video events', () => {
    expect(facade.hasVideoTag(null)).toBe(false);
    expect(facade.hasVideoTag('not-array')).toBe(false);
    expect(facade.hasVideoTag([{ event: 'unknown' }])).toBe(false);
    expect(facade.hasVideoTag([{ event: 'video_start' }])).toBe(true);
  });

  it('hasScrollTag returns false for non-arrays and detects built-in scroll events', () => {
    expect(facade.hasScrollTag(undefined)).toBe(false);
    expect(facade.hasScrollTag([{ event: 'unknown' }])).toBe(false);
    expect(facade.hasScrollTag([{ event: 'scroll' }])).toBe(true);
  });

  it('updateJsonForEvents adds missing events when shouldInclude=true', () => {
    const json: { event: string }[] = [];
    facade.updateJsonForEvents(json, true, ['video_start', 'video_complete']);
    expect(json).toEqual([
      { event: 'video_start' },
      { event: 'video_complete' }
    ]);
  });

  it('updateJsonForEvents removes events when shouldInclude=false', () => {
    const json = [{ event: 'video_start' }, { event: 'other' }];
    facade.updateJsonForEvents(json, false, ['video_start']);
    expect(json).toEqual([{ event: 'other' }]);
  });

  it('updateJsonBasedOnForm includes scroll/video events when their flags are true', () => {
    const json: { event: string }[] = [];
    const form = {
      includeVideoTag: true,
      includeScrollTag: true,
      includeItemScopedVariables: false
    };
    const result = facade.updateJsonBasedOnForm(json, form);
    expect(result.length).toBeGreaterThan(0);
    // Adding video and scroll events should be additive without duplicates.
    const events = result.map((entry: { event: string }) => entry.event);
    expect(new Set(events).size).toBe(events.length);
  });
});
