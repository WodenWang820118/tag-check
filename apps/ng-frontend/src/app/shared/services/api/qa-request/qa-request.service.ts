import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { GtmInspectionParams } from '../../utils/interfaces';
import { TestEvent, TestEventDetail, TestImage } from '@utils';

@Injectable({
  providedIn: 'root'
})
export class QaRequestService {
  private readonly isStopOperation = signal(false);
  isStopOperation$ = computed(() => this.isStopOperation());
  constructor(private readonly http: HttpClient) {}

  runDataLayerWithRequestCheck(
    projectSlug: string,
    eventId: string,
    params: GtmInspectionParams
  ) {
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
      .post<
        {
          testEvent: TestEvent;
          testEventDetails: TestEventDetail;
          testImage: TestImage;
        }[]
      >(
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
