import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { EventInspectionPreset } from '@utils';
import { catchError, map, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GtmOperatorService {
  constructor(private http: HttpClient) {}

  runInspectionViaGtm(
    projectSlug: string,
    eventId: string,
    gtmUrl: string,
    headless?: boolean,
    eventInspectionPreset?: EventInspectionPreset,
    measurmentId?: string,
    username?: string,
    password?: string,
    captureRequest?: boolean
  ) {
    const encodedGtmUrl = encodeURIComponent(gtmUrl);
    const queryParams = [`gtmUrl=${encodedGtmUrl}`];

    // GTM operator should be always headful
    if (headless !== undefined) queryParams.push(`headless=${false}`);
    if (measurmentId) queryParams.push(`measurementId=${measurmentId}`);
    if (username) queryParams.push(`username=${encodeURIComponent(username)}`);
    if (password) queryParams.push(`password=${encodeURIComponent(password)}`);
    if (captureRequest) queryParams.push(`captureRequest=${captureRequest}`);

    const queryString = queryParams.join('&');

    return this.http
      .post(
        `${environment.dataLayerApiUrl}/gtm-operator/${projectSlug}/${eventId}?${queryString}`,
        eventInspectionPreset
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  stopOperation(): Observable<string> {
    return this.http
      .post<string>(`${environment.dataLayerApiUrl}/stop-gtm-operation`, {})
      .pipe(
        map((message) => message),
        catchError((error) => {
          console.error('Error stopping operation:', error);
          throw error;
        })
      );
  }
}
