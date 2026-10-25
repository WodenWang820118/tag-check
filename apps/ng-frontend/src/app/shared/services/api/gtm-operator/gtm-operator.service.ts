import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ReportDetailResponse } from '@utils';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { GtmInspectionParams } from '../../utils/interfaces';

/**
 * Runs a test in accompanied mode: the backend opens GTM Preview (Tag
 * Assistant) first and replays the recording on the site it connects to.
 */
@Injectable({
  providedIn: 'root'
})
export class GtmOperatorService {
  /** Set when the user stopped the run, whose request then fails. */
  private readonly isStopOperation = signal(false);
  readonly isStopOperation$ = this.isStopOperation.asReadonly();

  constructor(private readonly http: HttpClient) {}

  /**
   * Runs the test and emits the API's result. A run the user stopped emits
   * `[]` instead of failing; any other failure errors with an Error whose
   * `cause` is the HttpErrorResponse.
   */
  runInspectionViaGtm(
    projectSlug: string,
    eventId: string,
    params: GtmInspectionParams
  ) {
    // A stop applies only to the run it interrupted. Every stop sets this
    // flag in all three run services, so without the reset a later failure
    // of this service's run would be taken for a stop and hidden.
    this.isStopOperation.set(false);
    const encodedGtmUrl = encodeURIComponent(params.gtmUrl);
    const queryParams = [`gtmUrl=${encodedGtmUrl}`];

    // Tag Assistant connects in headless Chromium too; a headless run
    // closes its browser when it ends, a headful one stays open.
    if (params.headless !== undefined)
      queryParams.push(`headless=${params.headless}`);
    if (params.measurementId)
      queryParams.push(`measurementId=${params.measurementId}`);
    if (params.username)
      queryParams.push(`username=${encodeURIComponent(params.username)}`);
    if (params.password)
      queryParams.push(`password=${encodeURIComponent(params.password)}`);
    if (params.captureRequest)
      queryParams.push(`captureRequest=${params.captureRequest}`);

    const queryString = queryParams.join('&');

    return this.http
      .post<ReportDetailResponse[]>(
        `${environment.dataLayerApiUrl}/gtm-operator/${projectSlug}/${eventId}?${queryString}`,
        params.eventInspectionPreset
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          if (this.isStopOperation$()) {
            return of([]);
          }
          return throwError(
            () => new Error('GTM inspection failed', { cause: error })
          );
        })
      );
  }

  stopOperation(): Observable<{ status: number; message: string }> {
    return this.http
      .post<{
        status: number;
        message: string;
      }>(`${environment.dataLayerApiUrl}/stop-gtm-operation`, {})
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
