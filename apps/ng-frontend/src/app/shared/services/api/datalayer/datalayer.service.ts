import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { EventInspectionPreset } from '@utils';
import { catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataLayerService {
  constructor(private http: HttpClient) {}

  runDataLayerInspection(
    projectSlug: string,
    eventId: string,
    headless?: boolean,
    eventInspectionPreset?: EventInspectionPreset,
    username?: string,
    password?: string
  ) {
    const queryParams = [];
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
