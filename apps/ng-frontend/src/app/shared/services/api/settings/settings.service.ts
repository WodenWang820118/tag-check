import { Injectable } from '@angular/core';
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

/**
 * Reads and saves a project's settings. Each save says how it went in a
 * snackbar, "Saved" or "Error", so the settings pages need not.
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  constructor(
    private readonly http: HttpClient,
    private readonly _snackBar: MatSnackBar
  ) {}

  getProjectSettings(projectSlug: string) {
    return this.http.get<ProjectSetting>(
      `${environment.settingsApiUrl}/${projectSlug}`
    );
  }

  updateProjectSetting(projectSlug: string, settings: Partial<ProjectSetting>) {
    return this.saveSettings(projectSlug, 'project', settings);
  }

  updateBrowserSetting(projectSlug: string, settings: Partial<BrowserSetting>) {
    return this.saveSettings(projectSlug, 'browser', settings);
  }

  updateAuthenticationSetting(
    projectSlug: string,
    settings: Partial<AuthenticationSetting>
  ) {
    return this.saveSettings(projectSlug, 'authentication', settings);
  }

  updateApplicationSetting(
    projectSlug: string,
    settings: Partial<ApplicationSetting>
  ) {
    return this.saveSettings(projectSlug, 'application', settings);
  }

  /**
   * Saves one section of the settings and shows "Saved", or "Error" when
   * the API answers with an empty object or the request fails. The error
   * is passed on to the caller.
   */
  private saveSettings(
    projectSlug: string,
    section: 'project' | 'browser' | 'authentication' | 'application',
    settings: object
  ) {
    return this.http
      .put<ProjectSetting>(
        `${environment.settingsApiUrl}/${projectSlug}/${section}`,
        settings
      )
      .pipe(
        tap((response) =>
          this.showResult(this.isEmptyObject(response) ? 'Error' : 'Saved')
        ),
        catchError((error: unknown) => {
          this.showResult('Error');
          return throwError(() => error);
        })
      );
  }

  private showResult(message: 'Saved' | 'Error') {
    this._snackBar.openFromComponent(SnackBarComponent, {
      duration: 5000,
      data: message
    });
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
