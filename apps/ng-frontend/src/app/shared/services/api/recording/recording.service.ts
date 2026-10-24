import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { Recording } from '@utils';
import { environment } from '../../../../../environments/environment';
import { rethrowHttpError } from '../http-error.utils';

/** Reads and saves a test's Chrome Recorder recording. */
@Injectable({
  providedIn: 'root'
})
export class RecordingService {
  constructor(private readonly http: HttpClient) {}

  /**
   * Fetches the full details of a single recording.
   *
   * @param projectSlug - URL-friendly project identifier.
   * @param eventId     - Test event identifier.
   * @returns Observable that errors with `'Failed to get recording details'`
   *   when the request fails, so callers can surface it in the UI.
   */
  getRecordingDetails(projectSlug: string, eventId: string) {
    if (!eventId || !projectSlug) return of({} as Recording);
    return this.http
      .get<Recording>(
        `${environment.recordingApiUrl}/${projectSlug}/${eventId}`
      )
      .pipe(rethrowHttpError('Failed to get recording details'));
  }

  /**
   * Persists an updated recording.
   *
   * @param projectSlug - URL-friendly project identifier.
   * @param eventId     - Test event identifier.
   * @param recording   - Full recording payload to persist.
   */
  updateRecording(projectSlug: string, eventId: string, recording: Recording) {
    return this.http
      .put<Recording>(
        `${environment.recordingApiUrl}/${projectSlug}/${eventId}`,
        recording
      )
      .pipe(rethrowHttpError('Failed to update recording'));
  }
}
