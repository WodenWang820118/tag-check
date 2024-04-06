import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProjectInfo } from '@utils';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProjectInfoService {
  constructor(private http: HttpClient) {}

  getProjects() {
    return this.http.get<ProjectInfo[]>(environment.projectApiUrl);
  }

  getProject(projectSlug: string) {
    return this.http.get<ProjectInfo>(
      `${environment.projectApiUrl}/${projectSlug}`
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
      version: settings.version || '1.0',
    };

    return this.http.post(
      `${environment.projectApiUrl}/init-project/${settings.projectSlug}`,
      {
        project,
      }
    );
  }

  updateProject(project: ProjectInfo) {
    console.log('Updating project: ', project);
    return this.http.put<ProjectInfo>(
      `${environment.projectApiUrl}/${project.projectSlug}`,
      project
    );
  }
}
