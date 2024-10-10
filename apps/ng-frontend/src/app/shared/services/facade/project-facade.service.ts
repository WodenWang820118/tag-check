import { Injectable } from '@angular/core';
import { catchError, combineLatest, map, switchMap, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SettingsService } from '../api/settings/settings.service';
import { RecordingService } from '../api/recording/recording.service';
import { ReportService } from '../api/report/report.service';
import { Recording } from '@utils';

@Injectable()
export class ProjectFacadeService {
  private hasRecordingMap: Map<string, boolean> = new Map();
  constructor(
    private route: ActivatedRoute,
    private settingsService: SettingsService,
    private reportService: ReportService,
    private recordingService: RecordingService
  ) {}

  observeProjectRecordingStatus(projectSlug: string) {
    return combineLatest([
      this.reportService.getProjectReportNames(projectSlug),
      this.recordingService.getProjectRecordings(projectSlug),
    ]).pipe(
      tap(([reportNames, projectRecording]) => {
        if (!reportNames || !projectRecording) return;
        this.initializeRecordingStatus(
          reportNames,
          projectRecording.recordings
        );
      }),
      catchError((error) => {
        console.error(error);
        return [];
      })
    );
  }

  initializeRecordingStatus(
    reportNames: string[],
    recordings: Record<string, Recording>
  ) {
    this.hasRecordingMap.clear();
    const reportSet = new Set(reportNames);
    for (const [key, value] of Object.entries(recordings)) {
      if (!reportSet.has(key)) continue;
      this.hasRecordingMap.set(key, value.steps.length > 0);
    }
  }

  hasRecording(eventId: string): boolean {
    return this.hasRecordingMap.get(eventId) || false;
  }

  observeNavigationEvents() {
    return this.route.params.pipe(
      switchMap((params) => {
        const slug = params['projectSlug'];
        return this.settingsService.getProjectSettings(slug);
      }),
      map((project) => {
        return project.settings['preventNavigationEvents'];
      }),
      catchError((error) => {
        console.error(error);
        return [];
      })
    );
  }
}
