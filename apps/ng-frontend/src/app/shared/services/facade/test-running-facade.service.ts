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
  map
} from 'rxjs';
import {
  IReportDetails,
  EventInspectionPresetDto,
  ProjectSetting
} from '@utils';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ProjectDataSourceService } from '../data-source/project-data-source.service';
import { QaRequestService } from '../api/qa-request/qa-request.service';
import { SettingsService } from '../api/settings/settings.service';
import { GtmInspectionParams } from '../utils/interfaces';

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
    private readonly settingsService: SettingsService
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
      map((res) => this.updateReportDetails(res, testDataSource)),
      catchError((error) => this.handleError(error)),
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
    res: any,
    testDataSource: MatTableDataSource<IReportDetails, MatPaginator>
  ) {
    if (!res) return;
    console.log('res', res[0]);
    // TODO: maybe return a consistent eventId from the backend
    // Spread the response directly without overriding eventId so matching works correctly
    const updatedEvent: IReportDetails = {
      ...res[0]
    };
    testDataSource.data = testDataSource.data.map((event) =>
      event.eventId === updatedEvent.eventId ? updatedEvent : event
    );
    this.projectDataSourceService.setData(testDataSource.data);
    return testDataSource;
  }

  private handleError(error: unknown): Observable<never> {
    console.error('Error in test operation:', error);
    return of();
  }
}
