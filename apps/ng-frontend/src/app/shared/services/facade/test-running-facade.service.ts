import { Injectable, signal } from '@angular/core';
import { DataLayerService } from '../api/datalayer/datalayer.service';
import { GtmOperatorService } from '../api/gtm-operator/gtm-operator.service';
import {
  switchMap,
  take,
  catchError,
  finalize,
  forkJoin,
  Observable,
  of,
  map
} from 'rxjs';
import {
  EventInspectionPresetDto,
  ProjectSetting,
  ReportDetailResponse
} from '@utils';
import { MatTableDataSource } from '@angular/material/table';
import { QaRequestService } from '../api/qa-request/qa-request.service';
import { SettingsService } from '../api/settings/settings.service';
import { GtmInspectionParams } from '../utils/interfaces';
import { ReportTableDataSourceModelService } from '../../../modules/project/services/report-table-data-source-model/report-table-data-source-model.service';

export type RunTestOptions = {
  /**
   * Close the run's browser when it ends. An accompanied-mode run otherwise
   * leaves its GTM Preview window open for inspection; a batch closes each
   * one so that windows do not pile up.
   */
  closeBrowser?: boolean;
};

/**
 * Runs one test the way the project's settings ask for: through GTM Preview
 * in accompanied mode, otherwise on the site directly, with or without the
 * request check. It tracks which test is running, for the play buttons and
 * the progress stream, and writes each result into the tests table.
 */
@Injectable({ providedIn: 'root' })
export class TestRunningFacadeService {
  private readonly isRunningTest = signal(false);
  private readonly eventRunningTest = signal('');

  /** Whether a test is running; the backend runs one browser at a time. */
  readonly isRunningTest$ = this.isRunningTest.asReadonly();
  /** The eventId of the running test, or '' when none runs. */
  readonly eventRunningTest$ = this.eventRunningTest.asReadonly();

  constructor(
    private readonly dataLayerService: DataLayerService,
    private readonly gtmOperatorService: GtmOperatorService,
    private readonly qaRequestService: QaRequestService,
    private readonly settingsService: SettingsService,
    private readonly reportTableDataSourceModelService: ReportTableDataSourceModelService
  ) {}

  /**
   * Runs a test, updates its row in the tests table that is shown when the
   * run ends, and emits the run's report (undefined when the API returned
   * none, as for a run the user stopped).
   */
  runTestForReport(
    eventId: string,
    projectSlug: string,
    options: RunTestOptions = {}
  ): Observable<ReportDetailResponse | undefined> {
    return this.run(eventId, projectSlug, options).pipe(
      map((res) => {
        const report = res?.[0];
        if (report) {
          this.updateReportDetails(eventId, report);
        }
        return report;
      })
    );
  }

  private run(eventId: string, projectSlug: string, options: RunTestOptions) {
    // The settings are read at run time so that a change made on a settings
    // page applies to the next run without reloading the tests page.
    return this.settingsService.getProjectSettings(projectSlug).pipe(
      take(1),
      switchMap((project) =>
        this.chooseAndRunTest(eventId, projectSlug, project, options)
      ),
      finalize(() => {
        this.isRunningTest.set(false);
        this.eventRunningTest.set('');
      })
    );
  }

  private chooseAndRunTest(
    eventId: string,
    projectSlug: string,
    project: ProjectSetting,
    options: RunTestOptions
  ) {
    const headless = project.browserSettings.headless;
    const inspectEventDto = new EventInspectionPresetDto(project);
    this.isRunningTest.set(true);
    this.eventRunningTest.set(eventId);

    const gtmInspectionParams: GtmInspectionParams = {
      gtmUrl: project.applicationSettings.gtm.gtmPreviewModeUrl,
      headless,
      eventInspectionPreset: inspectEventDto,
      measurementId: project.measurementId,
      username: project.authenticationSettings.username,
      password: project.authenticationSettings.password,
      captureRequest: project.applicationSettings.gtm.isRequestCheck
    };

    if (project.applicationSettings.gtm.isAccompanyMode) {
      gtmInspectionParams.measurementId = project.applicationSettings.gtm
        .isRequestCheck
        ? project.measurementId
        : undefined;
      gtmInspectionParams.closeBrowser = options.closeBrowser;
      return this.gtmOperatorService.runInspectionViaGtm(
        projectSlug,
        eventId,
        gtmInspectionParams
      );
    }

    if (project.applicationSettings.gtm.isRequestCheck) {
      return this.qaRequestService.runDataLayerWithRequestCheck(
        projectSlug,
        eventId,
        gtmInspectionParams
      );
    }
    return this.dataLayerService.runDataLayerInspection(projectSlug, eventId, {
      websiteUrl: project.applicationSettings.websiteUrl,
      headless,
      eventInspectionPreset: inspectEventDto,
      username: project.authenticationSettings.username,
      password: project.authenticationSettings.password,
      captureRequest: project.applicationSettings.gtm.isRequestCheck
    });
  }

  /**
   * Asks the backend to stop the running test. All three run services are
   * asked, since the caller does not know which one runs it; a failed stop
   * request is logged and does not fail the others.
   */
  stopOperation(): Observable<unknown> {
    return forkJoin({
      dataLayer: this.dataLayerService.stopOperation().pipe(
        catchError((error) => {
          console.error('Error stopping DataLayer operation:', error);
          return of(null);
        })
      ),
      gtmOperator: this.gtmOperatorService.stopOperation().pipe(
        catchError((error) => {
          console.error('Error stopping GTM Operator operation:', error);
          return of(null);
        })
      ),
      qaRequest: this.qaRequestService.stopOperation().pipe(
        catchError((error) => {
          console.error('Error stopping QA Request operation:', error);
          return of(null);
        })
      )
    }).pipe(
      finalize(() => {
        this.isRunningTest.set(false);
        this.eventRunningTest.set('');
      })
    );
  }

  /**
   * Writes a run's result into the test's row. The table is read when the
   * run ends, not when it starts: while a run lasts, the user may leave the
   * tests page and come back, which builds a new data source bound to a new
   * paginator and sort.
   */
  private updateReportDetails(eventId: string, result: ReportDetailResponse) {
    const current = this.reportTableDataSourceModelService.dataSource();
    // The API sends dates as strings; a missing one means the run just ended.
    const updatedAt = result.testEvent?.updatedAt
      ? new Date(result.testEvent.updatedAt)
      : new Date();

    const nextData = current.data.map((event) =>
      event.eventId === eventId
        ? {
            ...event,
            passed: result.testEventDetails?.passed ?? false,
            requestPassed: result.testEventDetails?.requestPassed ?? false,
            message: result.testEvent?.message ?? event.message,
            updatedAt,
            lastRunAt: result.testEvent?.lastRunAt ?? updatedAt
          }
        : event
    );

    // A new data source instance makes the signal, and the table, update.
    const next = new MatTableDataSource(nextData);
    next.paginator = current.paginator;
    next.sort = current.sort;
    next.filterPredicate = current.filterPredicate;
    next.filter = current.filter;
    this.reportTableDataSourceModelService.dataSource.set(next);
  }
}
