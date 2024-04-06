import { Injectable } from '@angular/core';
import { combineLatest, map, switchMap, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SettingsService } from '../api/settings/settings.service';
import { SpecService } from '../api/spec/spec.service';
import { Spec } from '../../models/spec.interface';
import { Recording } from '../../models/recording.interface';
import { RecordingService } from '../api/recording/recording.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectFacadeService {
  private hasRecordingMap: Map<string, boolean> = new Map();
  constructor(
    private route: ActivatedRoute,
    private settingsService: SettingsService,
    private specsService: SpecService,
    private recordingService: RecordingService
  ) {}

  observeProjectRecordingStatus(projectSlug: string) {
    return combineLatest([
      this.specsService.getProjectSpec(projectSlug),
      this.recordingService.getProjectRecordings(projectSlug),
    ]).pipe(
      tap(([specs, recordings]) => {
        this.initializeRecordingStatus(specs.specs, recordings.recordings);
      })
    );
  }

  // TODO: Big O(n^2) - can be optimized
  initializeRecordingStatus(specs: Spec[], recordings: Recording[]) {
    this.hasRecordingMap.clear();
    specs.forEach((spec) => {
      this.hasRecordingMap.set(
        spec.event,
        recordings.some((r) => r.title === spec.event)
      );
    });
  }

  hasRecording(eventName: string): boolean {
    return this.hasRecordingMap.get(eventName) || false;
  }

  observeNavigationEvents() {
    return this.route.params.pipe(
      switchMap((params) => {
        const slug = params['projectSlug'];
        return this.settingsService.getProjectSettings(slug);
      }),
      map((project) => {
        return project.settings['preventNavigationEvents'];
      })
    );
  }
}
