import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import {
  EventInspectionPreset,
  TestEvent,
  TestEventDetail,
  TestImage
} from '@utils';
import { catchError, map, Observable, of, throwError } from 'rxjs';

interface GtmInspectionParams {
  gtmUrl: string;
  headless?: boolean;
  eventInspectionPreset?: EventInspectionPreset;
  measurementId?: string;
  username?: string;
  password?: string;
  captureRequest?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GtmOperatorService {
  private readonly isStopOperation = signal(false);
  isStopOperation$ = computed(() => this.isStopOperation());

  constructor(private readonly http: HttpClient) {}

  runInspectionViaGtm(
    projectSlug: string,
    eventId: string,
    params: GtmInspectionParams
  ) {
    const encodedGtmUrl = encodeURIComponent(params.gtmUrl);
    const queryParams = [`gtmUrl=${encodedGtmUrl}`];

    // GTM operator should be always headful
    if (params.headless !== undefined) queryParams.push(`headless=${false}`);
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
      .post<
        {
          testEvent: TestEvent;
          testEventDetails: TestEventDetail;
          testImage: TestImage;
        }[]
      >(
        `${environment.dataLayerApiUrl}/gtm-operator/${projectSlug}/${eventId}?${queryString}`,
        params.eventInspectionPreset
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          if (this.isStopOperation$()) {
            return of([]);
          }
          return throwError(() => new Error('GTM inspection failed'));
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
          console.log('Operation stopped:', message);
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
