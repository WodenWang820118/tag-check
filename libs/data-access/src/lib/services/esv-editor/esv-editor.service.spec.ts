import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { EsvEditorService } from './esv-editor.service';

describe('EsvEditorService', () => {
  let service: EsvEditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EsvEditorService);
  });

  it('starts with empty content', () => {
    expect(service.content$()).toBe('');
  });

  it('updates content through setEsvContent', () => {
    service.setEsvContent('hello');
    expect(service.content$()).toBe('hello');
  });
});
