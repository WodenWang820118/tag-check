import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, map, of } from 'rxjs';
import { ProjectRecording } from '../../../models/recording.interface';
import { environment } from '../../../../../environments/environment';
import { EditorService } from '../../editor/editor.service';

@Injectable({
  providedIn: 'root',
})
export class RecordingService {
  mockUrl = 'http://localhost:3001/recordings';

  recordingSubject: Subject<ProjectRecording> = new BehaviorSubject(
    {} as ProjectRecording
  );
  recording$ = this.recordingSubject.asObservable();

  constructor(private http: HttpClient, private editorService: EditorService) {}

  getProjectRecordings(projectSlug: string) {
    return this.http.get(`${environment.recordingApiUrl}/${projectSlug}`);
  }

  getRecordingDetails(
    projectSlug: string | undefined,
    eventName: string | undefined
  ): Observable<ProjectRecording> {
    if (!eventName || !projectSlug) return of({} as ProjectRecording);
    return this.http
      .get<ProjectRecording>(`${environment.recordingApiUrl}/${projectSlug}`)
      .pipe(
        map((projectRecordings: ProjectRecording) => {
          if (projectRecordings) {
            // console.log('Project Recordings', projectRecordings);

            return projectRecordings.recordings.find(
              (recording) => recording.title === eventName
            );
          }
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
