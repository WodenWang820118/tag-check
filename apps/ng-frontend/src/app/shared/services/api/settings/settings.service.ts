import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ProjectSetting } from '@utils';
import { BehaviorSubject, of, Subject, tap } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarComponent } from '../../../components/snackbar/snackbar.components';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  currentProject: Subject<ProjectSetting> = new BehaviorSubject(
    {} as ProjectSetting
  );
  currentProject$ = this.currentProject.asObservable();
  constructor(private http: HttpClient, private _snackBar: MatSnackBar) {}

  getSettings() {
    return this.http.get<ProjectSetting[]>(environment.reportApiUrl);
  }

  getProjectSettings(projectSlug: string) {
    return this.http.get<ProjectSetting>(
      `${environment.settingsApiUrl}/${projectSlug}`
    );
  }

  updateSettings(projectSlug: string, section: string, settings: any) {
    if (!projectSlug || !settings) return of({} as ProjectSetting);
    return this.http
      .put<ProjectSetting>(
        `${environment.settingsApiUrl}/${projectSlug}/sections/${section}`,
        settings
      )
      .pipe(
        tap((response) => {
          if (!this.isEmptyObject(response.settings)) {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Saved',
            });
          } else {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 5000,
              data: 'Error',
            });
          }
        })
      );
  }

  addSettings(projectSlug: string, settings: any) {
    return this.http.post<ProjectSetting>(
      `${environment.settingsApiUrl}/${projectSlug}`,
      settings
    );
  }

  switchToProject(projectSlug: string) {
    return this.getProjectSettings(projectSlug).pipe(
      tap((project) => {
        this.setCurrentProject(project);
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
