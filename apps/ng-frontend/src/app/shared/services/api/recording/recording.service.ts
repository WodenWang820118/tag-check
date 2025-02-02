import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, throwError } from 'rxjs';
import { Recording } from '@utils';
import { environment } from '../../../../../environments/environment';
import { UtilsService } from '../../utils/utils.service';

@Injectable({
  providedIn: 'root'
})
export class RecordingService {
  tempRecordingContent = signal<Recording | null>(null);
  tempRecordingContent$ = computed(() => this.tempRecordingContent());
  recordingContent = signal<Recording | null>(null);
  recordingContent$ = computed(() => this.recordingContent());

  constructor(
    private http: HttpClient,
    private utilsService: UtilsService
  ) {}

  setTempRecording(recording: Recording | null) {
    this.tempRecordingContent.set(recording);
  }

  setRecording(recording: Recording | null) {
    this.recordingContent.set(recording);
  }

  readRecordingJsonFileContent(file: File): void {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const fileContentString = e.target.result;

      try {
        this.tempRecordingContent.set(JSON.parse(fileContentString));
      } catch (error) {
        console.error('Error parsing file content', error);
      }
    };

    reader.onerror = () => {
      console.error('Error reading file content');
    };

    reader.readAsText(file);
  }

  getProjectRecordings(projectSlug: string) {
    return this.http
      .get<Recording[]>(`${environment.recordingApiUrl}/${projectSlug}`)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  getProjectRecordingNames(projectSlug: string) {
    return this.http
      .get<string[]>(`${environment.recordingApiUrl}/${projectSlug}/names`)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of([]);
        })
      );
  }

  getRecordingDetails(projectSlug: string, eventId: string) {
    if (!eventId || !projectSlug) return of({} as Recording);
    return this.http
      .get<Recording>(
        `${environment.recordingApiUrl}/${projectSlug}/${eventId}`
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return throwError(() => new Error('Failed to get recording details'));
        })
      );
  }

  updateRecording(projectSlug: string, eventId: string, recording: Recording) {
    return this.http
      .put<Recording>(
        `${environment.recordingApiUrl}/${projectSlug}/${eventId}`,
        recording
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return throwError(() => new Error('Failed to update recording'));
        })
      );
  }
}
