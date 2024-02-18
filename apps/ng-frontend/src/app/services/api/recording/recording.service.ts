import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project } from '../../../models/project.interface';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  map,
  of,
  switchMap,
} from 'rxjs';
import { FormGroup } from '@angular/forms';
import { ProjectRecording } from '../../../models/recording.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RecordingService {
  mockUrl = 'http://localhost:3001/recordings';

  recordingSubject: Subject<ProjectRecording> = new BehaviorSubject(
    {} as ProjectRecording
  );
  recording$ = this.recordingSubject.asObservable();

  constructor(private http: HttpClient) {}

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

  addRecording(testCaseForm: FormGroup) {
    const projectSlug = testCaseForm.controls['projectSlug'].value;
    const recording = testCaseForm.controls['recording'].value;

    return this.http
      .get<ProjectRecording>(`${environment.recordingApiUrl}/${projectSlug}`)
      .pipe(
        switchMap((project: ProjectRecording) => {
          if (project) {
            const updatedProject = {
              ...project,
              recordings: [...project.recordings, recording],
            };

            console.log('updatedProject', updatedProject);
            return this.http.put<Project>(
              `${environment.recordingApiUrl}/${projectSlug}`,
              updatedProject
            );
          } else {
            return of(undefined);
          }
        }),
        catchError((error) => {
          console.error('error', error);
          // if the project does not exist, create it
          return this.http.post(`${environment.recordingApiUrl}`, {
            recordings: [recording],
          });
        })
      );
  }
}
