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
import { QaRequestService } from '../api/qa-request/qa-request.service';
import { SettingsService } from '../api/settings/settings.service';
import { GtmInspectionParams } from '../utils/interfaces';
import { ReportTableDataSourceModelService } from '../../../modules/project/services/report-table-data-source-model/report-table-data-source-model.service';

export type RunTestOptions = {
  /**
   * Run without a visible browser window. The project's browser setting
   * applies when it is left out. A headless accompanied-mode run closes its
   * browser when it ends; a headful one leaves its GTM Preview window open
   * for inspection.
   */
  headless?: boolean;
};

/**
 * Runs one test, from its play button, the way the project's settings ask
 * for: through GTM Preview in accompanied mode, otherwise on the site
 * directly, with or without the request check. It tracks which test is
 * running, for the play buttons and the progress stream, and writes each
 * result into the tests table. Batches run in the backend (BatchRunService).
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
          this.reportTableDataSourceModelService.applyRunResult(
            eventId,
            report
          );
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
    const headless = options.headless ?? project.browserSettings.headless;
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
}
