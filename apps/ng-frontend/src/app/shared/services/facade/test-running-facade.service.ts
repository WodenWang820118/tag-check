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
    console.log('project', project);
    const inspectEventDto = new EventInspectionPresetDto(project);
    // change the play button to a spinner
    this.isRunningTest.set(true);
    this.eventRunningTest.set(eventId);

    if (project.applicationSettings.gtm.isAccompanyMode) {
      const measurementId = project.applicationSettings.gtm.isRequestCheck
        ? project.measurementId
        : undefined;
      return this.gtmOperatorService.runInspectionViaGtm(
        projectSlug,
        eventId,
        project.applicationSettings.gtm.gtmPreviewModeUrl,
        headless,
        inspectEventDto,
        measurementId,
        project.authenticationSettings.username,
        project.authenticationSettings.password,
        project.applicationSettings.gtm.isRequestCheck
      );
    }

    if (project.applicationSettings.gtm.isRequestCheck) {
      console.log('Running data layer with request check');
      return this.qaRequestService.runDataLayerWithRequestCheck(
        projectSlug,
        eventId,
        project.measurementId || '',
        headless,
        inspectEventDto,
        project.authenticationSettings.username,
        project.authenticationSettings.password,
        project.applicationSettings.gtm.isRequestCheck
      );
    }
    console.log('Running data layer without request check');
    return this.dataLayerService.runDataLayerInspection(
      projectSlug,
      eventId,
      headless,
      inspectEventDto,
      project.authenticationSettings.username,
      project.authenticationSettings.password,
      project.applicationSettings.gtm.isRequestCheck
    );
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
    const updatedEvent: IReportDetails = {
      ...res[0],
      eventId: `${res[0].eventName}_${res[0].eventId}`
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
