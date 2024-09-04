import { catchError, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VideosService {
  constructor(private http: HttpClient) {}

  getVideo(projectSlug: string, eventId: string) {
    return this.http
      .get(`${environment.videoApiUrl}/${projectSlug}/${eventId}`, {
        responseType: 'blob',
      })
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(new Blob());
        })
      );
  }
}
