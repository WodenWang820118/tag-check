import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project } from '../../../models/project.interface';
import {
  BehaviorSubject,
  EMPTY,
  Subject,
  catchError,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  mockUrl = 'http://localhost:3000/projects';

  currentProject: Subject<Project> = new BehaviorSubject({} as Project);
  currentProject$ = this.currentProject.asObservable();

  constructor(private http: HttpClient) {}

  getProjects() {
    return this.http.get<Project[]>(this.mockUrl);
  }

  getProject(projectSlug: string) {
    return this.http.get<Project>(`${this.mockUrl}/${projectSlug}`);
  }

  setCurrentProject(project: Project) {
    this.currentProject.next(project);
  }

  initProject(rootProjectValue: string, settings: any) {
    // TODO: get the root project from the backend
    this.currentProject.next(settings);
    return this.http.post(`${this.mockUrl}`, {
      rootProject: rootProjectValue,
      ...settings,
      specs: [],
      reports: [],
      recordings: [],
    });
  }

  switchToProject(projectSlug: string) {
    return this.getProject(projectSlug).pipe(
      tap((project) => {
        this.setCurrentProject(project);
        console.log('switched to project', project);
      })
    );
  }

  updateProject(project: Project) {
    console.log('Updating project: ', project);
    return this.http.put<Project>(
      `${this.mockUrl}/${project.projectSlug}`,
      project
    );
  }

  addReport(testCaseForm: FormGroup) {
    console.log('Form: ', testCaseForm.value);
    const projectSpec = testCaseForm.controls['spec'].value;

    const eventName = JSON.parse(projectSpec).event;

    return this.currentProject$.pipe(
      take(1),
      switchMap((project) => {
        // if the event already exists in the project reports, do nothing
        if (eventName in project.reports && eventName in project.specs)
          return EMPTY;

        console.log('Current Project: ', project);

        const updatedProject: Project = {
          ...project,
          specs: [...project.specs, eventName],
          reports: [...project.reports, eventName],
        };
        return this.updateProject(updatedProject);
      }),
      catchError((error) => {
        // Handle or log an error
        console.error('Error updating project', error);
        return of(undefined);
      })
    );
  }
}
