import { catchError, map, Observable, of, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VideosService {
  constructor(private http: HttpClient) {}

  getVideo(
    projectSlug: string,
    eventId: string
  ): Observable<{ blob: Blob; hasVideo: boolean }> {
    return this.http
      .get(`${environment.videoApiUrl}/${projectSlug}/${eventId}`, {
        responseType: 'blob',
        observe: 'response'
      })
      .pipe(
        map((response) => ({
          blob: response.body!,
          hasVideo: response.headers.get('X-Video-Available') === 'true'
        })),
        catchError((error) => {
          console.error('Error fetching video:', error);
          return throwError(() => new Error('Failed to load video'));
        })
      );
  }
}
