import { TestBed } from '@angular/core/testing';

import { ProjectRetrieverService } from './project-retriever.service';

describe('ProjectRetrieverService', () => {
  let service: ProjectRetrieverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectRetrieverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
