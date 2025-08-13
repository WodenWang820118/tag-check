import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  constructor(private readonly http: HttpClient) {}

  getImage(projectSlug: string, eventId: string): Observable<{ blob: Blob }> {
    return this.http
      .get(`${environment.imageApiUrl}/${projectSlug}/${eventId}`, {
        headers: {
          Accept: 'image/png'
        },
        responseType: 'blob',
        observe: 'response'
      })
      .pipe(
        tap((response) => {
          console.warn('response: ', response);
        }),
        map((response) => {
          return {
            blob: response.body ? response.body : new Blob()
          };
        })
      );
  }
}
