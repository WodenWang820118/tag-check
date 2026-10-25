import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Jsonified, ScheduleRequest, ScheduleResponse } from '@utils';
import { environment } from '../../../../../environments/environment';
import type { BatchRunJson } from '../batch-runs/batch-runs.service';

/** A schedule as the schedules endpoints send it (dates are strings). */
export type ScheduleJson = Jsonified<ScheduleResponse>;

/**
 * A project's schedules: presets that start a headless batch of chosen tests
 * while the backend runs. Their runs are batches with `source: 'schedule'`.
 */
@Injectable({ providedIn: 'root' })
export class SchedulesService {
  private readonly http = inject(HttpClient);

  list(projectSlug: string): Observable<ScheduleJson[]> {
    return this.http.get<ScheduleJson[]>(
      `${environment.schedulesApiUrl}/${projectSlug}`
    );
  }

  /** 400 with the reason for an invalid preset or name. */
  create(
    projectSlug: string,
    request: ScheduleRequest
  ): Observable<ScheduleJson> {
    return this.http.post<ScheduleJson>(
      `${environment.schedulesApiUrl}/${projectSlug}`,
      request
    );
  }

  /** Fields left out keep their value. */
  update(
    projectSlug: string,
    scheduleId: number,
    changes: Partial<ScheduleRequest>
  ): Observable<ScheduleJson> {
    return this.http.put<ScheduleJson>(
      `${environment.schedulesApiUrl}/${projectSlug}/${scheduleId}`,
      changes
    );
  }

  delete(projectSlug: string, scheduleId: number): Observable<void> {
    return this.http.delete<void>(
      `${environment.schedulesApiUrl}/${projectSlug}/${scheduleId}`
    );
  }

  /** Enqueues the schedule's batch now; its next run is unchanged. */
  runNow(projectSlug: string, scheduleId: number): Observable<BatchRunJson> {
    return this.http.post<BatchRunJson>(
      `${environment.schedulesApiUrl}/${projectSlug}/${scheduleId}/run-now`,
      {}
    );
  }
}
