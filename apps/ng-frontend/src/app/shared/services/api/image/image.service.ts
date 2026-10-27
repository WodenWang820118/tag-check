import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

/** Loads the screenshot of a test's latest run. */
@Injectable({
  providedIn: 'root'
})
export class ImageService {
  constructor(private readonly http: HttpClient) {}

  /** A run's screenshot; the test's latest one without `runId`. */
  getImage(
    projectSlug: string,
    eventId: string,
    runId?: number
  ): Observable<{ blob: Blob }> {
    return this.http
      .get(`${environment.imageApiUrl}/${projectSlug}/${eventId}`, {
        headers: {
          Accept: 'image/png'
        },
        responseType: 'blob',
        observe: 'response',
        params: runId === undefined ? {} : { run: runId }
      })
      .pipe(
        map((response) => {
          return {
            blob: response.body ?? new Blob()
          };
        })
      );
  }
}
