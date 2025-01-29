import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { catchError } from 'rxjs/internal/operators/catchError';
import { of } from 'rxjs';
import { Project } from '@utils';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(private http: HttpClient) {}

  getProjects() {
    return this.http.get<Project[]>(environment.projectApiUrl).pipe(
      catchError((error) => {
        console.error(error);
        return of([] as Project[]);
      })
    );
  }

  getProject(projectSlug: string) {
    return this.http
      .get<Project>(`${environment.projectApiUrl}/${projectSlug}`)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  initProject(rootProjectValue: string, settings: any) {
    const project: Project = {
      projectName: settings.projectName,
      projectSlug: settings.projectSlug,
      projectDescription: settings.projectDescription || '',
      measurementId: settings.measurementId || ''
    };

    return this.http
      .post(
        `${environment.projectApiUrl}/init-project/${settings.projectSlug}`,
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
      .put<Project>(
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
