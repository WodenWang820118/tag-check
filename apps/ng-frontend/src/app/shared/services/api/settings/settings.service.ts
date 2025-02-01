import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import {
  ApplicationSetting,
  AuthenticationSetting,
  BrowserSetting,
  ProjectSetting
} from '@utils';
import {
  BehaviorSubject,
  catchError,
  of,
  Subject,
  tap,
  throwError
} from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from '../../../components/snackbar/snackbar.component';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  currentProject: Subject<ProjectSetting> = new BehaviorSubject(
    {} as ProjectSetting
  );
  currentProject$ = this.currentProject.asObservable();
  constructor(
    private http: HttpClient,
    private _snackBar: MatSnackBar
  ) {}

  getSettings() {
    return this.http.get<ProjectSetting[]>(environment.reportApiUrl).pipe(
      catchError((error) => {
        console.error(error);
        return of([]);
      })
    );
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
          if (!this.isEmptyObject(response)) {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Saved'
            });
          } else {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Error'
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
          if (!this.isEmptyObject(response)) {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Saved'
            });
          } else {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Error'
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
          if (!this.isEmptyObject(response)) {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Saved'
            });
          } else {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Error'
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
    return this.http
      .put<ProjectSetting>(
        `${environment.settingsApiUrl}/${projectSlug}/application`,
        settings
      )
      .pipe(
        tap((response) => {
          if (!this.isEmptyObject(response)) {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Saved'
            });
          } else {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Error'
            });
          }
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  addSettings(projectSlug: string, settings: any) {
    return this.http
      .post<ProjectSetting>(
        `${environment.settingsApiUrl}/${projectSlug}`,
        settings
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      );
  }

  switchToProject(projectSlug: string) {
    return this.getProjectSettings(projectSlug).pipe(
      tap((project) => {
        this.setCurrentProject(project);
      }),
      catchError((error) => {
        console.error(error);
        return of(null);
      })
    );
  }

  setCurrentProject(project: ProjectSetting) {
    this.currentProject.next(project);
  }

  private isEmptyObject(obj: any) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
  }
}
