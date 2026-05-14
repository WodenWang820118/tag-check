import { map, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { rethrowHttpError } from '../http-error.utils';

@Injectable({
  providedIn: 'root'
})
export class VideosService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Fetches the recorded video blob for a specific test event.
   *
   * @param projectSlug - URL-friendly project identifier.
   * @param eventId     - Test event identifier.
   * @returns An observable emitting `{ blob }` on success, or an error
   *   with message `'Failed to load video'` on HTTP failure.
   */
  getVideo(projectSlug: string, eventId: string): Observable<{ blob: Blob }> {
    return this.http
      .get(`${environment.videoApiUrl}/${projectSlug}/${eventId}`, {
        responseType: 'blob',
        observe: 'response'
      })
      .pipe(
        map((response) => ({
          blob: response.body ?? new Blob()
        })),
        rethrowHttpError('Failed to load video')
      );
  }
}
