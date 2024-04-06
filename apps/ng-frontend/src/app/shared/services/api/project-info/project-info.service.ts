import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project } from '../../../models/project.interface';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProjectInfoService {
  constructor(private http: HttpClient) {}

  getProjects() {
    return this.http.get<Project[]>(environment.projectApiUrl);
  }

  getProject(projectSlug: string) {
    return this.http.get<Project>(
      `${environment.projectApiUrl}/${projectSlug}`
    );
  }

  initProject(rootProjectValue: string, settings: any) {
    // TODO: may need a DTO validation here
    return this.http.post(
      `${environment.projectApiUrl}/init-project/${settings.projectSlug}`,
      {
        rootProject: rootProjectValue,
        projectName: settings.projectName,
        projectDescription: settings.projectDescription || '',
        projectSlug: settings.projectSlug,
        googleSpreadsheetLink: settings.googleSpreadsheetLink || '',
        measurementId: settings.measurementId || '',
      }
    );
  }

  updateProject(project: Project) {
    console.log('Updating project: ', project);
    return this.http.put<Project>(
      `${environment.projectApiUrl}/${project.projectSlug}`,
      project
    );
  }
}
