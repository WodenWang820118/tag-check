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
import { EMPTY, Observable, of, throwError, timer } from 'rxjs';
import { GTMConfiguration, Project, ProjectSchema } from '@utils';

interface StartupProjectSeedReadiness {
  ready: boolean;
  projectCount: number;
}

const STARTUP_SEED_READINESS_MAX_ATTEMPTS = 60;
const STARTUP_SEED_READINESS_RETRY_DELAY_MS = 1000;
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

    this.startupProjectListCheck$ =
      this.waitForStartupProjectSeedReadiness().pipe(
        switchMap(() => this.getNonEmptyProjectsAfterStartupSeed()),
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

  private waitForStartupProjectSeedReadiness(): Observable<StartupProjectSeedReadiness> {
    return this.getStartupProjectSeedReadiness().pipe(
      expand((readiness, attemptIndex) => {
        if (
          this.isStartupProjectSeedReady(readiness) ||
          attemptIndex >= STARTUP_SEED_READINESS_MAX_ATTEMPTS - 1
        ) {
          return EMPTY;
        }

        return timer(STARTUP_SEED_READINESS_RETRY_DELAY_MS).pipe(
          switchMap(() => this.getStartupProjectSeedReadiness())
        );
      }),
      last(),
      switchMap((readiness) => {
        if (this.isStartupProjectSeedReady(readiness)) {
          return of(readiness);
        }

        return throwError(
          () =>
            new Error(
              `Startup project seed did not become ready after ${STARTUP_SEED_READINESS_MAX_ATTEMPTS} attempts.`
            )
        );
      })
    );
  }

  private getStartupProjectSeedReadiness(): Observable<StartupProjectSeedReadiness> {
    return this.http
      .get<StartupProjectSeedReadiness>(
        environment.startupProjectSeedReadinessApiUrl
      )
      .pipe(
        catchError(() =>
          of({
            ready: false,
            projectCount: 0
          })
        )
      );
  }

  private getNonEmptyProjectsAfterStartupSeed(): Observable<ProjectSchema[]> {
    return this.getProjects().pipe(
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
      switchMap((projects) => {
        if (projects.length > 0) {
          return of(projects);
        }

        return throwError(
          () =>
            new Error(
              `Startup project list remained empty after ${STARTUP_PROJECT_LIST_MAX_ATTEMPTS} attempts.`
            )
        );
      })
    );
  }

  private isStartupProjectSeedReady(
    readiness: StartupProjectSeedReadiness
  ): boolean {
    return readiness.ready && readiness.projectCount > 0;
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
