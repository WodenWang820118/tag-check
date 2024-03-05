import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ProjectSetting } from '../../../models/setting.interface';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(private http: HttpClient) {}

  getSettings() {
    return this.http.get<ProjectSetting[]>(environment.reportApiUrl);
  }

  getProjectSettings(projectSlug: string) {
    console.log(`${environment.settingsApiUrl}/${projectSlug}`);
    return this.http.get<ProjectSetting>(
      `${environment.settingsApiUrl}/${projectSlug}`
    );
  }

  updateSettings(projectSlug: string, section: string, settings: any) {
    if (!projectSlug || !settings) return of({} as ProjectSetting);
    return this.http.put<ProjectSetting>(
      `${environment.settingsApiUrl}/${projectSlug}/sections/${section}`,
      settings
    );
  }

  addSettings(projectSlug: string, settings: any) {
    return this.http.post<ProjectSetting>(
      `${environment.settingsApiUrl}/${projectSlug}`,
      settings
    );
  }
}
