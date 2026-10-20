import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { RecordingService } from '../../../shared/services/api/recording/recording.service';
import { recordingResolver } from './recording.resolver';

describe('recordingResolver', () => {
  const recordingService = { getProjectRecordings: vi.fn() };

  beforeEach(() => {
    TestBed.resetTestingModule();
    recordingService.getProjectRecordings = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: RecordingService, useValue: recordingService }]
    });
  });

  it('fetches recordings for the route slug', () => {
    const obs = of([]);
    recordingService.getProjectRecordings.mockReturnValue(obs);

    const result = TestBed.runInInjectionContext(() =>
      recordingResolver(
        { params: { projectSlug: 'a' } } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );

    expect(result).toBe(obs);
    expect(recordingService.getProjectRecordings).toHaveBeenCalledWith('a');
  });
});
