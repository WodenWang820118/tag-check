import { TestBed } from '@angular/core/testing';

import { EditorService } from './editor.service';
import { describe, it } from 'vitest';

describe.skip('EditorService', () => {
  let service: EditorService;

  beforeEach(() => {
    // Instantiate directly to avoid Angular TestBed provider resolution in this unit test
    service = new EditorService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
