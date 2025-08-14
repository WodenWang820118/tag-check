import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { catchError, map, Observable, of } from 'rxjs';
import { GtmInspectionParams } from '../../utils/interfaces';

@Injectable({
  providedIn: 'root'
})
export class QaRequestService {
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
      .post(
        `${environment.dataLayerApiUrl}/${projectSlug}/${eventId}${queryString}`,
        params.eventInspectionPreset
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
      .post<string>(`${environment.dataLayerApiUrl}/stop-operation`, {})
      .pipe(
        map((message) => message),
        catchError((error) => {
          console.error('Error stopping operation:', error);
          throw error;
        })
      );
  }
}
