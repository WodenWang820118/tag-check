import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { EventInspectionPreset } from '@utils';
import { catchError, map, Observable, throwError } from 'rxjs';

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
      httpParams = httpParams.set('websiteUrl', websiteUrl);
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
      .post(
        `${environment.dataLayerApiUrl}/${projectSlug}/${eventId}`,
        eventInspectionPreset,
        { params: httpParams }
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return throwError(
            () => 'Error running data layer inspection: ' + error
          );
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
