import { Injectable } from '@angular/core';
import { catchError, combineLatest, map, switchMap, tap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SettingsService } from '../api/settings/settings.service';
import { RecordingService } from '../api/recording/recording.service';
import { ReportService } from '../api/report/report.service';

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
      this.recordingService.getProjectRecordingNames(projectSlug),
    ]).pipe(
      tap(([reportNames, recordingNames]) => {
        this.initializeRecordingStatus(reportNames, recordingNames);
      }),
      catchError((error) => {
        console.error(error);
        return [];
      })
    );
  }

  initializeRecordingStatus(reportNames: string[], recordingNames: string[]) {
    this.hasRecordingMap.clear();
    const reportSet = new Set(reportNames);
    for (const recordingName of recordingNames) {
      if (reportSet.has(recordingName)) {
        this.hasRecordingMap.set(recordingName, true);
      }
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
