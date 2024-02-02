import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project } from '../../models/project.interface';
import { BehaviorSubject, Subject, tap } from 'rxjs';

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

  initProject(settings: any) {
    // TODO: get the root project from the backend
    this.currentProject.next(settings);
    return this.http.post(`${this.mockUrl}`, {
      rootProject: 'D:\\Projects',
      ...settings,
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
}
