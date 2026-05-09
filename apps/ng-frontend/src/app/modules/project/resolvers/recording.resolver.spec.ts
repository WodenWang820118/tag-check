import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { RecordingService } from '../../../shared/services/api/recording/recording.service';
import {
  recordingDetailResolver,
  recordingResolver
} from './recording.resolver';

describe('recordingResolver', () => {
  const recordingService = {
    getProjectRecordings: vi.fn(),
    getRecordingDetails: vi.fn()
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    recordingService.getProjectRecordings = vi.fn();
    recordingService.getRecordingDetails = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: RecordingService, useValue: recordingService }]
    });
  });

  function runList(route: Partial<ActivatedRouteSnapshot>) {
    return TestBed.runInInjectionContext(() =>
      recordingResolver(
        route as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );
  }

  function runDetail(route: Partial<ActivatedRouteSnapshot>) {
    return TestBed.runInInjectionContext(() =>
      recordingDetailResolver(
        route as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
    );
  }

  it('fetches recordings for the route slug', () => {
    const obs = of([]);
    recordingService.getProjectRecordings.mockReturnValue(obs);

    const result = runList({ params: { projectSlug: 'a' } } as any);

    expect(result).toBe(obs);
    expect(recordingService.getProjectRecordings).toHaveBeenCalledWith('a');
  });

  it('fetches recording details using parent slug and event id', () => {
    const obs = of({} as any);
    recordingService.getRecordingDetails.mockReturnValue(obs);

    const result = runDetail({
      parent: { params: { projectSlug: 'a' } } as any,
      params: { eventId: 'e1' }
    } as any);

    expect(result).toBe(obs);
    expect(recordingService.getRecordingDetails).toHaveBeenCalledWith(
      'a',
      'e1'
    );
  });

  it('passes undefined slug when no parent route exists', () => {
    recordingService.getRecordingDetails.mockReturnValue(of(null));

    runDetail({ parent: null, params: { eventId: 'e9' } } as any);

    expect(recordingService.getRecordingDetails).toHaveBeenCalledWith(
      undefined,
      'e9'
    );
  });
});
