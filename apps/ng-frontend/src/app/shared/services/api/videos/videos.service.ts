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
   * @param view        - `tag-assistant` for the Tag Assistant recording of an
   *   accompanied-mode run; the site recording otherwise.
   * @returns An observable emitting `{ blob }` on success, or an error
   *   with message `'Failed to load video'` on HTTP failure.
   */
  getVideo(
    projectSlug: string,
    eventId: string,
    view?: 'tag-assistant'
  ): Observable<{ blob: Blob }> {
    return this.http
      .get(`${environment.videoApiUrl}/${projectSlug}/${eventId}`, {
        responseType: 'blob',
        observe: 'response',
        params: view ? { view } : {}
      })
      .pipe(
        map((response) => ({
          blob: response.body ?? new Blob()
        })),
        rethrowHttpError('Failed to load video')
      );
  }
}
