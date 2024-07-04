import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, catchError, of } from 'rxjs';
import { ProjectRecording, Recording } from '@utils';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RecordingService {
  recordingSubject: Subject<ProjectRecording> = new BehaviorSubject(
    {} as ProjectRecording
  );
  recording$ = this.recordingSubject.asObservable();

  constructor(private http: HttpClient) {}

  getProjectRecordings(projectSlug: string) {
    return this.http
      .get<ProjectRecording>(`${environment.recordingApiUrl}/${projectSlug}`)
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
          return of(null);
        })
      );
  }

  updateRecording(projectSlug: string, eventId: string, recording: string) {
    const jsonRecording = JSON.parse(recording);
    if (!eventId || !projectSlug || !recording) return of({} as Recording);
    return this.http
      .put<Recording>(
        `${environment.recordingApiUrl}/${projectSlug}/${eventId}`,
        jsonRecording
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  addRecording(projectSlug: string, eventId: string, content: string) {
    const jsonContent = JSON.parse(content);
    console.log('Project Slug', projectSlug);
    console.log('Event Id', eventId);
    console.log('Recording', jsonContent);
    if (!eventId || !projectSlug || this.isEmptyObject(jsonContent))
      return of(null);
    return this.http
      .post<Recording>(
        `${environment.recordingApiUrl}/${projectSlug}/${eventId}`,
        jsonContent
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  private isEmptyObject(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value !== 'object') {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    if (value instanceof Date) {
      return false;
    }

    if (value instanceof Set || value instanceof Map) {
      return value.size === 0;
    }

    return (
      Object.keys(value as object).length === 0 &&
      Object.getOwnPropertySymbols(value as object).length === 0
    );
  }
}
