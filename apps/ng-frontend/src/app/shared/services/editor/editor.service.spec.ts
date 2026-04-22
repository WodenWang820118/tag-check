import { EditorService } from './editor.service';
import { beforeEach, describe, expect, it } from 'vitest';

describe('EditorService', () => {
  let service: EditorService;

  beforeEach(() => {
    service = new EditorService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('formats valid JSON content and clears syntax errors', () => {
    service.setContent('specJson', '{"event":"purchase"}');

    expect(service.contentSubjects.specJson()).toContain('"event": "purchase"');
    expect(service.isJsonSyntaxError()).toBe(false);
  });

  it('keeps invalid JSON content visible and marks a syntax error', () => {
    service.setContent('specJson', '{"event"');

    expect(service.contentSubjects.specJson()).toBe('{"event"');
    expect(service.isJsonSyntaxError()).toBe(true);
  });
});
