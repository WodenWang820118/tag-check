import { Injectable } from '@angular/core';
import { combineLatest, map, switchMap, tap } from 'rxjs';
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
      })
    );
  }

  // TODO: Big O(n^2) - can be optimized
  initializeRecordingStatus(reportNames: string[], recordingNames: string[]) {
    this.hasRecordingMap.clear();
    // console.log('reports', reportNames);
    // console.log('recordings', recordingNames);
    reportNames.forEach((reportName) => {
      this.hasRecordingMap.set(
        reportName,
        recordingNames.some((recordingName) => recordingName === reportName)
      );
    });
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
      })
    );
  }
}
