import {
  Component,
  computed,
  inject,
  input,
  ChangeDetectionStrategy
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportDetailPanelsComponent } from '../report-detail-panels/report-detail-panels.component';
import {
  getRunStatus,
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
  const status = getRunStatus(reportDetails);
  // History lists this test's runs, so it exists once the test has run.
  const hasHistory = status !== 'notRun';
  const recordingAvailable = !!context.videoBlob && context.videoBlob.size > 0;

  return {
    title: context.spec.rawGtmTag?.tag?.name || 'Report',
    lastRunAt: reportDetails?.lastRunAt ?? reportDetails?.updatedAt,
    status,
    passed: reportDetails?.passed ?? false,
    eventName: reportDetails?.eventName || '',
    message: reportDetails?.message || '',
    showHistory: hasHistory,
    showShareMenu: hasHistory,
    canExportSpreadsheet: Boolean(
      context.projectSlug && reportDetails?.eventId
    ),
    canExportRecording: recordingAvailable,
    canExportEvent: Boolean(
      context.projectSlug && reportDetails?.eventId && recordingAvailable
    ),
    hasMedia:
      (context.imageBlob?.size || 0) > 0 && (context.videoBlob?.size || 0) > 0,
    videoBlob: context.videoBlob,
    tagAssistantVideoBlob: context.tagAssistantVideoBlob,
    imageBlob: context.imageBlob
  };
}

/** A test's Latest result tab, built from the report page's route context. */
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./report-tab.component.scss']
})
export class ReportTabComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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

    // The commands are relative to the test's route: without relativeTo
    // they resolve from the root, to /buckets, which matches no route.
    void this.router.navigate(context.historyLinkCommands, {
      relativeTo: this.route,
      queryParams: { event: context.reportDetails?.eventName }
    });
  }
}
