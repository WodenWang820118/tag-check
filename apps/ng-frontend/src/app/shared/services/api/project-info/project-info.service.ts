import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import {
  catchError,
  expand,
  finalize,
  last,
  shareReplay,
  switchMap,
  tap
} from 'rxjs/operators';
import { EMPTY, Observable, of, timer } from 'rxjs';
import { GTMConfiguration, Project, ProjectSchema } from '@utils';

const STARTUP_PROJECT_LIST_MAX_ATTEMPTS = 10;
const STARTUP_PROJECT_LIST_RETRY_DELAY_MS = 300;

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private hasCompletedStartupProjectListCheck = false;
  private startupProjectListCheck$: Observable<ProjectSchema[]> | null = null;

  constructor(private readonly http: HttpClient) {}

  getProjects(): Observable<ProjectSchema[]> {
    return this.http.get<ProjectSchema[]>(environment.projectApiUrl).pipe(
      catchError((error) => {
        console.error(error);
        throw error;
      })
    );
  }

  getProjectsAfterStartupSeed(): Observable<ProjectSchema[]> {
    if (this.hasCompletedStartupProjectListCheck) {
      return this.getProjects();
    }

    if (this.startupProjectListCheck$) {
      return this.startupProjectListCheck$;
    }

    this.startupProjectListCheck$ = this.getProjects().pipe(
      expand((projects, attemptIndex) => {
        if (
          projects.length > 0 ||
          attemptIndex >= STARTUP_PROJECT_LIST_MAX_ATTEMPTS - 1
        ) {
          return EMPTY;
        }

        // Desktop startup can briefly expose an empty list before the seeded project is visible.
        return timer(STARTUP_PROJECT_LIST_RETRY_DELAY_MS).pipe(
          switchMap(() => this.getProjects())
        );
      }),
      last(),
      tap(() => {
        this.hasCompletedStartupProjectListCheck = true;
      }),
      finalize(() => {
        this.startupProjectListCheck$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.startupProjectListCheck$;
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

  getProjectGtmConfig(projectSlug: string) {
    return this.http
      .get<GTMConfiguration>(
        `${environment.projectApiUrl}/${projectSlug}/gtm-config`
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }
}
