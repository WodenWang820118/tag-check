import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProjectInfo } from '@utils';
import { environment } from '../../../../../environments/environment';
import { catchError } from 'rxjs/internal/operators/catchError';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectInfoService {
  constructor(private http: HttpClient) {}

  getProjects() {
    return this.http.get<ProjectInfo[]>(environment.projectApiUrl).pipe(
      catchError((error) => {
        console.error(error);
        return of([] as ProjectInfo[]);
      })
    );
  }

  getProject(projectSlug: string) {
    return this.http
      .get<ProjectInfo>(`${environment.projectApiUrl}/${projectSlug}`)
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  initProject(rootProjectValue: string, settings: any) {
    const project: ProjectInfo = {
      rootProject: rootProjectValue,
      projectName: settings.projectName,
      projectSlug: settings.projectSlug,
      projectDescription: settings.projectDescription || '',
      measurementId: settings.measurementId || '',
      googleSpreadsheetLink: settings.googleSpreadsheetLink || '',
      version: settings.version || '1.0'
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

  updateProject(project: ProjectInfo) {
    console.log('Updating project: ', project);
    return this.http
      .put<ProjectInfo>(
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
