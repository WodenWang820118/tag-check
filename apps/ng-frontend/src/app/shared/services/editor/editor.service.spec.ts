import { TestBed } from '@angular/core/testing';

import { EditorService } from './editor.service';
import { describe, it } from 'vitest';

describe('EditorService', () => {
  let service: EditorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
