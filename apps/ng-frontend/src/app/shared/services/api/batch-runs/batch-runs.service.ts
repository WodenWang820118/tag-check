import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import type {
  BatchRunResponse,
  CreateBatchRunRequest,
  Jsonified
} from '@utils';
import { environment } from '../../../../../environments/environment';

/** A batch as the batch-runs endpoints send it (dates are strings). */
export type BatchRunJson = Jsonified<BatchRunResponse>;

/**
 * The backend's batch queue: batches of tests it runs one at a time, whether
 * or not a window is open. Progress arrives as `batchUpdate` events on
 * GET /events (ProgressEventsService).
 */
@Injectable({ providedIn: 'root' })
export class BatchRunsService {
  private readonly http = inject(HttpClient);

  /** Enqueues the tests, in the given order; 400 for tests the project lacks. */
  create(
    projectSlug: string,
    request: CreateBatchRunRequest
  ): Observable<BatchRunJson> {
    return this.http.post<BatchRunJson>(
      `${environment.batchRunsApiUrl}/${projectSlug}`,
      request
    );
  }

  /** The project's newest batch, or null before its first one. */
  getLatest(projectSlug: string): Observable<BatchRunJson | null> {
    return this.http
      .get<BatchRunJson[]>(`${environment.batchRunsApiUrl}/${projectSlug}`, {
        params: new HttpParams().set('limit', 1)
      })
      .pipe(map((batches) => batches[0] ?? null));
  }

  get(projectSlug: string, batchId: number): Observable<BatchRunJson> {
    return this.http.get<BatchRunJson>(
      `${environment.batchRunsApiUrl}/${projectSlug}/${batchId}`
    );
  }

  /** Cancels the batch: its running test is stopped and the rest skipped. */
  cancel(projectSlug: string, batchId: number): Observable<BatchRunJson> {
    return this.http.post<BatchRunJson>(
      `${environment.batchRunsApiUrl}/${projectSlug}/${batchId}/cancel`,
      {}
    );
  }
}
