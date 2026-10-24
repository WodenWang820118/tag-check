import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { GtmInspectionParams } from '../../utils/interfaces';
import { ReportDetailResponse } from '@utils';

/**
 * Runs a test on the site directly with the request check: the backend also
 * captures the GA4 request the event sends to the measurement ID.
 */
@Injectable({
  providedIn: 'root'
})
export class QaRequestService {
  /** Set when the user stopped the run, whose request then fails. */
  private readonly isStopOperation = signal(false);
  readonly isStopOperation$ = this.isStopOperation.asReadonly();
  constructor(private readonly http: HttpClient) {}

  /**
   * Runs the test and emits the API's result. A run the user stopped emits
   * `[]` instead of failing; any other failure errors with an Error whose
   * `cause` is the HttpErrorResponse.
   */
  runDataLayerWithRequestCheck(
    projectSlug: string,
    eventId: string,
    params: GtmInspectionParams
  ) {
    // A stop applies only to the run it interrupted; see GtmOperatorService.
    this.isStopOperation.set(false);
    const queryParams = [];
    if (params.measurementId)
      queryParams.push(`measurementId=${params.measurementId}`);
    if (params.headless !== undefined)
      queryParams.push(`headless=${params.headless}`);
    if (params.username) queryParams.push(`username=${params.username}`);
    if (params.password) queryParams.push(`password=${params.password}`);
    if (params.captureRequest)
      queryParams.push(`captureRequest=${params.captureRequest}`);
    const queryString = queryParams.length ? '?' + queryParams.join('&') : '';
    return this.http
      .post<ReportDetailResponse[]>(
        `${environment.dataLayerApiUrl}/${projectSlug}/${eventId}${queryString}`,
        params.eventInspectionPreset
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          if (this.isStopOperation$()) {
            return of([]);
          }
          return throwError(() => new Error('Data layer inspection failed'));
        })
      );
  }

  stopOperation(): Observable<{ status: number; message: string }> {
    return this.http
      .post<{
        status: number;
        message: string;
      }>(`${environment.dataLayerApiUrl}/stop-operation`, {})
      .pipe(
        map((message) => {
          if (message.status === 200) {
            this.isStopOperation.set(true);
          }
          return message;
        }),
        catchError((error) => {
          console.error('Error stopping operation:', error);
          throw error;
        })
      );
  }
}
