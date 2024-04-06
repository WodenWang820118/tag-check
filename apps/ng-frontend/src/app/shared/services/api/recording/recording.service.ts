import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, map, of } from 'rxjs';
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

  getRecordingDetails(projectSlug: string, eventName: string) {
    if (!eventName || !projectSlug) return of({} as ProjectRecording);
    return this.http
      .get<ProjectRecording>(`${environment.recordingApiUrl}/${projectSlug}`)
      .pipe(
        map((projectRecordings: ProjectRecording) => {
          if (projectRecordings) {
            for (const recording of projectRecordings.recordings) {
              if (recording.title === eventName) {
                return recording;
              }
            }
          }
          return {} as ProjectRecording;
        })
      );
  }

  addRecording(projectSlug: string, eventName: string, content: string) {
    const jsonContent = JSON.parse(content);
    console.log('Project Slug', projectSlug);
    console.log('Event Name', eventName);
    console.log('Recording', jsonContent);

    return this.http.post(
      `${environment.recordingApiUrl}/${projectSlug}/${eventName}`,
      {
        data: jsonContent,
      }
    );
  }
}
