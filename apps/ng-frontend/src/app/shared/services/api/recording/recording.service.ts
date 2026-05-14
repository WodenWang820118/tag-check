import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, from, tap, finalize } from 'rxjs';
import { Recording } from '@utils';
import { environment } from '../../../../../environments/environment';
import { catchHttpError, rethrowHttpError } from '../http-error.utils';

@Injectable({
  providedIn: 'root'
})
export class RecordingService {
  tempRecordingContent = signal<Recording | null>(null);
  tempRecordingContent$ = computed(() => this.tempRecordingContent());
  recordingContent = signal<Recording | null>(null);
  recordingContent$ = computed(() => this.recordingContent());
  isLoading = signal(false);
  isLoading$ = computed(() => this.isLoading());

  constructor(private readonly http: HttpClient) {}

  setTempRecording(recording: Recording | null) {
    this.tempRecordingContent.set(recording);
  }

  setRecording(recording: Recording | null) {
    this.recordingContent.set(recording);
  }

  setLoading(isLoading: boolean) {
    this.isLoading.set(isLoading);
  }

  readRecordingJsonFileContent(file: File): void {
    this.setLoading(true);

    from(file.text())
      .pipe(
        tap((text) => {
          const fileContentString = String(text ?? '');
          try {
            this.tempRecordingContent.set(JSON.parse(fileContentString));
          } catch (error) {
            console.error('Error parsing file content', error);
            this.tempRecordingContent.set(null);
          }
        }),
        catchError((err) => {
          console.error('Error reading file content', err);
          this.tempRecordingContent.set(null);
          return of(null);
        }),
        finalize(() => {
          setTimeout(() => {
            this.setLoading(false);
          }, 1000);
        })
      )
      .subscribe();
  }

  /**
   * Fetches all recordings belonging to a project.
   *
   * Returns `null` on HTTP failure so callers can treat a missing recording
   * list as an empty state rather than an unrecoverable error.
   *
   * @param projectSlug - URL-friendly project identifier.
   */
  getProjectRecordings(projectSlug: string) {
    return this.http
      .get<Recording[]>(`${environment.recordingApiUrl}/${projectSlug}`)
      .pipe(catchHttpError(null));
  }

  /**
   * Fetches only the names (identifiers) for a project's recordings.
   *
   * Returns `[]` on HTTP failure so UI list bindings stay functional.
   *
   * @param projectSlug - URL-friendly project identifier.
   */
  getProjectRecordingNames(projectSlug: string) {
    return this.http
      .get<string[]>(`${environment.recordingApiUrl}/${projectSlug}/names`)
      .pipe(catchHttpError([] as string[]));
  }

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
