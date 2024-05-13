import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { EventInspectionPreset } from '@utils';
import { catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class QaRequestService {
  constructor(private http: HttpClient) {}

  runDataLayerWithRequestCheck(
    projectSlug: string,
    eventId: string,
    measurementId: string,
    headless?: boolean,
    eventInspectionPreset?: EventInspectionPreset,
    username?: string,
    password?: string
  ) {
    const queryParams = [];
    if (measurementId) queryParams.push(`measurementId=${measurementId}`);
    if (headless !== undefined) queryParams.push(`headless=${headless}`);
    if (username) queryParams.push(`username=${username}`);
    if (password) queryParams.push(`password=${password}`);
    const queryString = queryParams.length ? '?' + queryParams.join('&') : '';
    return this.http
      .post(
        `${environment.dataLayerApiUrl}/${projectSlug}/${eventId}${queryString}`,
        eventInspectionPreset
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }
}
