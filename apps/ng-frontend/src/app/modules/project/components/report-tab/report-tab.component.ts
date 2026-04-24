import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { ReportDetailPanelsComponent } from '../report-detail-panels/report-detail-panels.component';
import {
  ReportDetailRouteContext,
  ReportTabViewModel
} from '../report-detail.contracts';
import { ReportTabFacade } from './report-tab-facade.service';
import { ReportTabViewComponent } from './report-tab-view.component';

function buildReportTabViewModel(
  context: ReportDetailRouteContext | undefined
): ReportTabViewModel | undefined {
  if (!context) {
    return undefined;
  }

  const reportDetails = context.reportDetails;
  const hasHistory =
    context.fileReports.flatMap((report) => report.testEventDetails).length > 0;
  const recordingAvailable =
    !!context.videoBlob && context.videoBlob.size > 0;

  return {
    title: context.spec.rawGtmTag?.tag?.name || 'Report',
    createdAt: reportDetails?.createdAt,
    passed: reportDetails?.passed ?? false,
    eventName: reportDetails?.eventName || '',
    message: reportDetails?.message || '',
    showHistory: hasHistory,
    showShareMenu: hasHistory,
    canExportSpreadsheet: Boolean(context.projectSlug && reportDetails?.eventId),
    canExportRecording: recordingAvailable,
    canExportEvent: Boolean(
      context.projectSlug && reportDetails?.eventId && recordingAvailable
    ),
    hasMedia:
      (context.imageBlob?.size || 0) > 0 && (context.videoBlob?.size || 0) > 0,
    videoBlob: context.videoBlob,
    imageBlob: context.imageBlob
  };
}

@Component({
  selector: 'app-report-tab',
  standalone: true,
  imports: [ReportTabViewComponent, ReportDetailPanelsComponent],
  providers: [ReportTabFacade],
  template: `
    @if (viewModel(); as model) {
      <app-report-tab-view
        [viewModel]="model"
        (copyEventName)="copyEventName()"
        (exportSpreadsheet)="shareSpreadsheet()"
        (exportRecording)="exportRecording()"
        (exportEvent)="exportEvent()"
        (openHistory)="openHistory()"
      >
        <app-report-detail-panels
          report-detail-content
          [context]="context()"
        ></app-report-detail-panels>
      </app-report-tab-view>
    }
  `,
  styleUrls: ['./report-tab.component.scss']
})
export class ReportTabComponent {
  private readonly router = inject(Router);

  context = input<ReportDetailRouteContext | undefined>(undefined);
  viewModel = computed(() => buildReportTabViewModel(this.context()));

  constructor(private readonly facade: ReportTabFacade) {}

  copyEventName() {
    this.facade.copyEventName(this.context()?.reportDetails?.eventName);
  }

  shareSpreadsheet() {
    const context = this.context();
    this.facade.shareSpreadsheet(context?.projectSlug, context?.reportDetails);
  }

  exportRecording() {
    const context = this.context();
    this.facade.exportRecording(
      context?.projectSlug,
      context?.reportDetails,
      context?.videoBlob
    );
  }

  exportEvent() {
    const context = this.context();
    this.facade.exportEvent(
      context?.projectSlug,
      context?.reportDetails,
      context?.videoBlob
    );
  }

  openHistory() {
    const context = this.context();
    if (!context) {
      return;
    }

    void this.router.navigate(context.historyLinkCommands, {
      queryParams: { event: context.reportDetails?.eventName }
    });
  }
}
