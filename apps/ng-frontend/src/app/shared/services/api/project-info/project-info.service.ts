import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { catchError } from 'rxjs/internal/operators/catchError';
import { of } from 'rxjs';
import { Project, ProjectSchema } from '@utils';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(private readonly http: HttpClient) {}

  getProjects() {
    return this.http.get<ProjectSchema[]>(environment.projectApiUrl).pipe(
      catchError((error) => {
        console.error(error);
        throw error;
      })
    );
  }

  getProject(projectSlug: string) {
    return this.http
      .get<ProjectSchema>(`${environment.projectApiUrl}/${projectSlug}`)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  initProject(project: Project) {
    return this.http
      .post<ProjectSchema>(
        `${environment.projectApiUrl}/init-project/${project.projectSlug}`,
        project
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  updateProject(project: Project) {
    console.log('Updating project: ', project);
    return this.http
      .put<ProjectSchema>(
        `${environment.projectApiUrl}/${project.projectSlug}`,
        project
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }
}
