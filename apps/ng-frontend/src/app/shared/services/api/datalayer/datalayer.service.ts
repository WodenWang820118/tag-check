import { computed, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import {
  EventInspectionPreset,
  TestEvent,
  TestEventDetail,
  TestImage
} from '@utils';
import { catchError, map, Observable, of, throwError } from 'rxjs';

export interface RunDataLayerParams {
  websiteUrl: string;
  headless?: boolean;
  eventInspectionPreset?: EventInspectionPreset;
  username?: string;
  password?: string;
  captureRequest?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DataLayerService {
  private readonly isStopOperation = signal(false);
  isStopOperation$ = computed(() => this.isStopOperation());
  constructor(private readonly http: HttpClient) {}

  runDataLayerInspection(
    projectSlug: string,
    eventId: string,
    params: RunDataLayerParams
  ) {
    const {
      websiteUrl,
      headless,
      eventInspectionPreset,
      username,
      password,
      captureRequest
    } = params;
    let httpParams = new HttpParams();
    // include website URL
    if (websiteUrl) {
      httpParams = httpParams.set('url', new URL(websiteUrl).toString());
    }
    // set optional parameters
    if (headless !== undefined) {
      httpParams = httpParams.set('headless', headless.toString());
    }
    if (username) {
      httpParams = httpParams.set('username', username);
    }
    if (password) {
      httpParams = httpParams.set('password', password);
    }
    if (captureRequest !== undefined) {
      httpParams = httpParams.set('captureRequest', captureRequest.toString());
    }

    return this.http
      .post<
        {
          testEvent: TestEvent;
          testEventDetails: TestEventDetail;
          testImage: TestImage;
        }[]
      >(
        `${environment.dataLayerApiUrl}/${projectSlug}/${eventId}`,
        eventInspectionPreset,
        { params: httpParams }
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          // If a stopOperation was requested, swallow the error so global
          // interceptors (like Sentry) aren't triggered. Return an empty result
          // observable which matches the expected response type.
          if (this.isStopOperation$()) {
            this.isStopOperation.set(false);
            return of([]);
          }
          return throwError(
            () =>
              'Error running data layer inspection: ' +
              JSON.stringify(error, null, 2)
          );
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
