import { Injectable } from '@angular/core';
import { Project } from '../../models/project.interface';
import { Observable, map, switchMap, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SettingsService } from '../api/settings/settings.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectFacadeService {
  private hasRecordingMap: Map<string, boolean> = new Map();
  constructor(
    private route: ActivatedRoute,
    private settingsService: SettingsService
  ) {}

  observeProjectRecordingStatus(project$: Observable<Project>) {
    return project$.pipe(
      tap((project) => {
        this.initializeRecordingStatus(project.specs, project.recordings);
      })
    );
  }

  initializeRecordingStatus(specs: any[], recordings: string[]) {
    this.hasRecordingMap.clear();
    specs.forEach((spec) => {
      this.hasRecordingMap.set(spec.event, recordings.includes(spec.event));
    });
  }

  hasRecording(eventName: string): boolean {
    return this.hasRecordingMap.get(eventName) || false;
  }

  observeNavigationEvents() {
    return this.route.params.pipe(
      switchMap((params) => {
        console.log('params', params);
        const slug = params['projectSlug'];
        return this.settingsService.getProjectSettings(slug);
      }),
      map((project) => {
        return project.settings['preventNavigationEvents'];
      })
    );
  }
}
