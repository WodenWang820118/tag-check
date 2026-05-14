import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import {
  ApplicationSetting,
  AuthenticationSetting,
  BrowserSetting,
  ProjectSetting
} from '@utils';
import { catchError, tap, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from '../../../components/snackbar/snackbar.component';
import { catchHttpError } from '../http-error.utils';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  currentProject = signal<ProjectSetting>({} as ProjectSetting);
  currentProject$ = computed(() => this.currentProject());
  constructor(
    private readonly http: HttpClient,
    private readonly _snackBar: MatSnackBar
  ) {}

  /**
   * Fetches all project settings (used for the project list).
   *
   * Returns `[]` on HTTP failure so list consumers stay functional.
   */
  getSettings() {
    return this.http
      .get<ProjectSetting[]>(environment.reportApiUrl)
      .pipe(catchHttpError([] as ProjectSetting[]));
  }

  getProjectSettings(projectSlug: string) {
    return this.http
      .get<ProjectSetting>(`${environment.settingsApiUrl}/${projectSlug}`)
      .pipe(
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  updateProjectSetting(projectSlug: string, settings: Partial<ProjectSetting>) {
    return this.http
      .put<ProjectSetting>(
        `${environment.settingsApiUrl}/${projectSlug}/project`,
        settings
      )
      .pipe(
        tap((response) => {
          if (this.isEmptyObject(response)) {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Error'
            });
          } else {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Saved'
            });
          }
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  updateBrowserSetting(projectSlug: string, settings: Partial<BrowserSetting>) {
    return this.http
      .put<ProjectSetting>(
        `${environment.settingsApiUrl}/${projectSlug}/browser`,
        settings
      )
      .pipe(
        tap((response) => {
          if (this.isEmptyObject(response)) {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Error'
            });
          } else {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Saved'
            });
          }
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  updateAuthenticationSetting(
    projectSlug: string,
    settings: Partial<AuthenticationSetting>
  ) {
    return this.http
      .put<ProjectSetting>(
        `${environment.settingsApiUrl}/${projectSlug}/authentication`,
        settings
      )
      .pipe(
        tap((response) => {
          if (this.isEmptyObject(response)) {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Error'
            });
          } else {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Saved'
            });
          }
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  updateApplicationSetting(
    projectSlug: string,
    settings: Partial<ApplicationSetting>
  ) {
    console.log(`Updating application settings for ${projectSlug}`, settings);
    return this.http
      .put<ProjectSetting>(
        `${environment.settingsApiUrl}/${projectSlug}/application`,
        settings
      )
      .pipe(
        tap((response) => {
          if (this.isEmptyObject(response)) {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Error'
            });
          } else {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Saved'
            });
          }
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Creates a new project settings entry.
   *
   * Returns `null` on HTTP failure so the caller can decide whether to
   * retry or surface the error.
   *
   * @param projectSlug - URL-friendly project identifier.
   * @param settings    - Partial settings object to persist.
   */
  addSettings(projectSlug: string, settings: Partial<ProjectSetting>) {
    return this.http
      .post<ProjectSetting>(
        `${environment.settingsApiUrl}/${projectSlug}`,
        settings
      )
      .pipe(catchHttpError(null));
  }

  /**
   * Loads settings for the given project and sets it as the current project.
   *
   * Returns `null` on HTTP failure — the current project is not updated in
   * that case.
   *
   * @param projectSlug - URL-friendly project identifier.
   */
  switchToProject(projectSlug: string) {
    return this.getProjectSettings(projectSlug).pipe(
      tap((project) => {
        this.setCurrentProject(project);
      }),
      catchHttpError(null)
    );
  }

  setCurrentProject(project: ProjectSetting) {
    this.currentProject.set(project);
  }

  private isEmptyObject(obj: unknown): obj is Record<string, never> {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      !Array.isArray(obj) &&
      Object.keys(obj).length === 0
    );
  }
}
