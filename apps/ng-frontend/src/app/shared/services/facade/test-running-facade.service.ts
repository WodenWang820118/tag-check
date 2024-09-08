import { Injectable } from '@angular/core';
import { DataLayerService } from '../api/datalayer/datalayer.service';
import { GtmOperatorService } from '../api/gtm-operator/gtm-operator.service';
import {
  switchMap,
  BehaviorSubject,
  take,
  catchError,
  finalize,
  forkJoin,
  Observable,
  of,
  map,
} from 'rxjs';
import {
  IReportDetails,
  EventInspectionPresetDto,
  ProjectSetting,
} from '@utils';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ProjectDataSourceService } from '../project-data-source/project-data-source.service';
import { QaRequestService } from '../api/qa-request/qa-request.service';
import { SettingsService } from '../api/settings/settings.service';

@Injectable({ providedIn: 'root' })
export class TestRunningFacadeService {
  isRunningTestSubject = new BehaviorSubject<boolean>(false);
  eventRunningTestSubject = new BehaviorSubject<string>('');

  isRunningTest$ = this.isRunningTestSubject.asObservable();
  eventRunningTest$ = this.eventRunningTestSubject.asObservable();

  constructor(
    private dataLayerService: DataLayerService,
    private gtmOperatorService: GtmOperatorService,
    private qaRequestService: QaRequestService,
    private projectDataSourceService: ProjectDataSourceService,
    private settingsService: SettingsService
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
        this.isRunningTestSubject.next(false);
        this.eventRunningTestSubject.next('');
      })
    );
  }

  chooseAndRunTest(
    eventId: string,
    projectSlug: string,
    project: ProjectSetting
  ) {
    const headless = project.settings.headless;
    console.log('project', project);
    const inspectEventDto = new EventInspectionPresetDto(project);
    // change the play button to a spinner
    this.isRunningTestSubject.next(true);
    this.eventRunningTestSubject.next(eventId);

    if (
      project.settings.gtm.isAccompanyMode ||
      (project.settings.gtm.isAccompanyMode &&
        project.settings.gtm.isRequestCheck)
    ) {
      const measurementId = project.settings.gtm.isRequestCheck
        ? project.settings.measurementId
        : undefined;
      return this.gtmOperatorService.runInspectionViaGtm(
        projectSlug,
        eventId,
        project.settings.gtm.gtmPreviewModeUrl,
        headless,
        inspectEventDto,
        measurementId,
        project.settings.authentication.username,
        project.settings.authentication.password,
        project.settings.gtm.isRequestCheck
      );
    }

    if (project.settings.gtm.isRequestCheck) {
      return this.qaRequestService.runDataLayerWithRequestCheck(
        projectSlug,
        eventId,
        project.settings.measurementId,
        headless,
        inspectEventDto,
        project.settings.authentication.username,
        project.settings.authentication.password
      );
    }

    return this.dataLayerService.runDataLayerInspection(
      projectSlug,
      eventId,
      headless,
      inspectEventDto,
      project.settings.authentication.username,
      project.settings.authentication.password
    );
  }

  stopOperation(): Observable<any> {
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
      ),
    }).pipe(
      map((res) => res),
      finalize(() => {
        console.log('Stop operation completed, setting isRunningTest to false');
        this.isRunningTestSubject.next(false);
        this.eventRunningTestSubject.next('');
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
      eventId: `${res[0].eventName}_${res[0].eventId}`,
    };
    testDataSource.data = testDataSource.data.map((event) =>
      event.eventId === updatedEvent.eventId ? updatedEvent : event
    );
    this.projectDataSourceService.setData(testDataSource.data);
    return testDataSource;
  }

  private handleError(error: any): Observable<never> {
    console.error('Error in test operation:', error);
    return of();
  }
}
