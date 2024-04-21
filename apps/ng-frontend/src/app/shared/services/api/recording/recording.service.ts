import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { ProjectRecording } from '@utils';
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
    if (!eventId || !projectSlug) return of({} as ProjectRecording);
    return this.http.get<ProjectRecording>(
      `${environment.recordingApiUrl}/${projectSlug}/${eventId}`
    );
  }

  addRecording(projectSlug: string, eventId: string, content: string) {
    const jsonContent = JSON.parse(content);
    console.log('Project Slug', projectSlug);
    console.log('Event Id', eventId);
    console.log('Recording', jsonContent);

    return this.http.post(
      `${environment.recordingApiUrl}/${projectSlug}/${eventId}`,
      {
        data: jsonContent,
      }
    );
  }
}
