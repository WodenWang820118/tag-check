import { computed, Injectable, signal, WritableSignal } from '@angular/core';
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
  map,
  throwError
} from 'rxjs';
import {
  IReportDetails,
  EventInspectionPresetDto,
  ProjectSetting,
  TestEvent,
  TestEventDetail,
  TestImage
} from '@utils';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ProjectDataSourceService } from '../data-source/project-data-source.service';
import { QaRequestService } from '../api/qa-request/qa-request.service';
import { SettingsService } from '../api/settings/settings.service';
import { GtmInspectionParams } from '../utils/interfaces';
import { ReportTableDataSourceModelService } from '../../../modules/project/services/report-table-data-source-model/report-table-data-source-model.service';

@Injectable({ providedIn: 'root' })
export class TestRunningFacadeService {
  // Signals to track test-running state
  private readonly isRunningTest: WritableSignal<boolean> = signal(false);
  private readonly eventRunningTest: WritableSignal<string> = signal('');

  readonly isRunningTest$ = computed(() => this.isRunningTest());
  readonly eventRunningTest$ = computed(() => this.eventRunningTest());

  constructor(
    private readonly dataLayerService: DataLayerService,
    private readonly gtmOperatorService: GtmOperatorService,
    private readonly qaRequestService: QaRequestService,
    private readonly projectDataSourceService: ProjectDataSourceService,
    private readonly settingsService: SettingsService,
    private readonly reportTableDataSourceModelService: ReportTableDataSourceModelService
  ) {}

  runTest(
    eventId: string,
    projectSlug: string,
    testDataSource: MatTableDataSource<IReportDetails, MatPaginator>
  ) {
    return this.settingsService.getProjectSettings(projectSlug).pipe(
      take(1),
      switchMap((project) =>
        this.chooseAndRunTest(eventId, projectSlug, project)
      ),
      map((res) => this.updateReportDetails(eventId, res, testDataSource)),
      catchError((error) => throwError(() => error)),
      finalize(() => {
        this.isRunningTest.set(false);
        this.eventRunningTest.set('');
      })
    );
  }

  chooseAndRunTest(
    eventId: string,
    projectSlug: string,
    project: ProjectSetting
  ) {
    const headless = project.browserSettings.headless;
    const inspectEventDto = new EventInspectionPresetDto(project);
    // change the play button to a spinner
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
      const measurementId = project.applicationSettings.gtm.isRequestCheck
        ? project.measurementId
        : undefined;

      gtmInspectionParams.measurementId = measurementId;
      return this.gtmOperatorService.runInspectionViaGtm(
        projectSlug,
        eventId,
        gtmInspectionParams
      );
    }

    if (project.applicationSettings.gtm.isRequestCheck) {
      console.log('Running data layer with request check');
      return this.qaRequestService.runDataLayerWithRequestCheck(
        projectSlug,
        eventId,
        gtmInspectionParams
      );
    }
    console.log('Running data layer without request check');
    return this.dataLayerService.runDataLayerInspection(projectSlug, eventId, {
      websiteUrl: project.applicationSettings.websiteUrl,
      headless,
      eventInspectionPreset: inspectEventDto,
      username: project.authenticationSettings.username,
      password: project.authenticationSettings.password,
      captureRequest: project.applicationSettings.gtm.isRequestCheck
    });
  }

  stopOperation(): Observable<unknown> {
    console.log('Stop operation from the test running facade');

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
      map((res) => res),
      finalize(() => {
        console.log('Stop operation completed, setting isRunningTest to false');
        this.isRunningTest.set(false);
        this.eventRunningTest.set('');
      })
    );
  }

  private updateReportDetails(
    eventId: string,
    res: {
      testEvent: TestEvent;
      testEventDetails: TestEventDetail;
      testImage: TestImage;
    }[],
    testDataSource: MatTableDataSource<IReportDetails, MatPaginator>
  ) {
    console.log('updateReportDetails called with eventId:', eventId);
    console.log('updateReportDetails called with res:', res);
    const result = res[0];
    // Prefer the server-provided updatedAt if available; otherwise mark as now to indicate "run"
    // Derive a Date for updatedAt: accept Date/number/string from server, otherwise use current time
    const rawUpdatedAt: unknown = (
      result?.testEvent as unknown as { updatedAt?: unknown }
    )?.updatedAt;
    let updatedAt: Date;
    if (rawUpdatedAt instanceof Date) {
      updatedAt = rawUpdatedAt;
    } else if (
      typeof rawUpdatedAt === 'number' ||
      typeof rawUpdatedAt === 'string'
    ) {
      updatedAt = new Date(rawUpdatedAt);
    } else {
      updatedAt = new Date();
    }

    const nextData = testDataSource.data.map((event) =>
      event.eventId === eventId
        ? {
            // preserve the original identity
            ...event,
            passed: result.testEventDetails?.passed ?? false,
            requestPassed: result.testEventDetails?.requestPassed ?? false,
            message: result.testEvent?.message ?? [],
            updatedAt
          }
        : event
    );

    // Replace the MatTableDataSource instance to trigger signal/reactivity
    const newDs = new MatTableDataSource<IReportDetails>([...nextData]);
    newDs.paginator = testDataSource.paginator;
    newDs.sort = testDataSource.sort;
    // Preserve current filter/predicate until effects re-apply
    newDs.filterPredicate = testDataSource.filterPredicate;
    newDs.filter = testDataSource.filter;

    this.reportTableDataSourceModelService.dataSource.set(newDs);

    console.log('Updated dataSource via signal:', newDs.data);
    return newDs;
  }
}
