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
    return this.http.get(`${this.mockUrl}/${projectSlug}`);
  }

  getRecordingDetails(
    projectSlug: string | undefined,
    eventName: string | undefined
  ): Observable<ProjectRecording> {
    if (!eventName || !projectSlug) return of({} as ProjectRecording);

    return this.http.get<ProjectRecording[]>(`${this.mockUrl}`).pipe(
      map((projectRecordings: ProjectRecording[]) => {
        if (projectRecordings && projectRecordings !== undefined) {
          console.log('Project Recordings', projectRecordings);
          const project = projectRecordings.find(
            (recording) => recording.projectSlug === projectSlug
          );

          const recording = project?.recordings.find(
            (recording) => recording.event === eventName
          );

          return recording;
        } else {
          return [{}] as ProjectRecording[];
        }
      })
    );
  }

  addRecording(testCaseForm: FormGroup) {
    const projectSlug = testCaseForm.controls['projectSlug'].value;
    const recording = testCaseForm.controls['recording'].value;

    return this.http
      .get<ProjectRecording>(`${this.mockUrl}/${projectSlug}`)
      .pipe(
        switchMap((project: ProjectRecording) => {
          if (project) {
            const updatedProject = {
              ...project,
              recordings: [...project.recordings, recording],
            };

            console.log('updatedProject', updatedProject);
            return this.http.put<Project>(
              `${this.mockUrl}/${projectSlug}`,
              updatedProject
            );
          } else {
            return of(undefined);
          }
        }),
        catchError((error) => {
          console.error('error', error);
          // if the project does not exist, create it
          return this.http.post(`${this.mockUrl}`, {
            recordings: [recording],
          });
        })
      );
  }
}
