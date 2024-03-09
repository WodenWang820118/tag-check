import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project } from '../../../models/project.interface';
import { BehaviorSubject, Subject, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProjectInfoService {
  currentProject: Subject<Project> = new BehaviorSubject({} as Project);
  currentProject$ = this.currentProject.asObservable();

  constructor(private http: HttpClient) {}

  getProjects() {
    return this.http.get<Project[]>(environment.projectApiUrl);
  }

  getProject(projectSlug: string) {
    return this.http.get<Project>(
      `${environment.projectApiUrl}/${projectSlug}`
    );
  }

  setCurrentProject(project: Project) {
    this.currentProject.next(project);
  }

  initProject(rootProjectValue: string, settings: any) {
    // console.log('rootProjectValue', rootProjectValue);
    // console.log('init-project', settings);
    this.currentProject.next(settings);
    return this.http.post(
      `${environment.projectApiUrl}/init-project/${settings.projectSlug}`,
      {
        rootProject: rootProjectValue,
        projectName: settings.projectName,
        projectDescription: settings.projectDescription || '',
        projectSlug: settings.projectSlug,
        testType: settings.testType,
        googleSpreadsheetLink: settings.googleSpreadsheetLink || '',
        tagManagerUrl: settings.tagManagerUrl || '',
        gtmId: settings.gtmId || '',
        specs: [],
        reports: [],
        recordings: [],
      }
    );
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
      `${environment.projectApiUrl}/${project.projectSlug}`,
      project
    );
  }
}
