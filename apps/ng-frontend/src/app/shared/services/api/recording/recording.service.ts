import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, of } from 'rxjs';
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
    return this.http.get<ProjectRecording>(
      `${environment.recordingApiUrl}/${projectSlug}`
    );
  }

  getProjectRecordingNames(projectSlug: string) {
    return this.http.get<string[]>(
      `${environment.recordingApiUrl}/${projectSlug}/names`
    );
  }

  getRecordingDetails(projectSlug: string, eventId: string) {
    if (!eventId || !projectSlug) return of({} as Recording);
    return this.http.get<Recording>(
      `${environment.recordingApiUrl}/${projectSlug}/${eventId}`
    );
  }

  updateRecording(projectSlug: string, eventId: string, recording: string) {
    const jsonRecording = JSON.parse(recording);
    if (!eventId || !projectSlug || !recording) return of({} as Recording);
    return this.http.put<Recording>(
      `${environment.recordingApiUrl}/${projectSlug}/${eventId}`,
      jsonRecording
    );
  }

  addRecording(projectSlug: string, eventId: string, content: string) {
    const jsonContent = JSON.parse(content);
    console.log('Project Slug', projectSlug);
    console.log('Event Id', eventId);
    console.log('Recording', jsonContent);

    return this.http.post<Recording>(
      `${environment.recordingApiUrl}/${projectSlug}/${eventId}`,
      jsonContent
    );
  }
}
