import { Injectable } from '@angular/core';
import { DataLayerService } from '../api/datalayer/datalayer.service';
import { GtmOperatorService } from '../api/gtm-operator/gtm-operator.service';
import { switchMap, BehaviorSubject, take } from 'rxjs';
import { InspectEventDto } from '../../../modules/project/components/report-table/utils';
import { IInspectEvent } from '../../models/inspectData.interface';
import { IReportDetails } from '../../models/report.interface';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ProjectDataSourceService } from '../project-data-source/project-data-source.service';
import { QaRequestService } from '../api/qa-request/qa-request.service';
import { SettingsService } from '../api/settings/settings.service';

@Injectable({
  providedIn: 'root',
})
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
    eventName: string,
    projectSlug: string,
    testDataSource: MatTableDataSource<IReportDetails, MatPaginator>
  ) {
    return this.settingsService
      .getProjectSettings(projectSlug)
      .pipe(
        take(1),
        switchMap((project) => {
          const headless = project.settings.headless;
          const inspectEventDto: IInspectEvent = new InspectEventDto(project);
          // change the play button to a spinner
          this.isRunningTestSubject.next(true);
          this.eventRunningTestSubject.next(eventName);

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
              eventName,
              project.settings.gtm.gtmPreviewModeUrl,
              headless,
              inspectEventDto,
              measurementId,
              project.settings.authentication.username,
              project.settings.authentication.password
            );
          }

          if (project.settings.gtm.isRequestCheck) {
            return this.qaRequestService.runDataLayerWithRequestCheck(
              projectSlug,
              eventName,
              project.settings.measurementId,
              headless,
              inspectEventDto,
              project.settings.authentication.username,
              project.settings.authentication.password
            );
          }

          return this.dataLayerService.runDataLayerInspection(
            projectSlug,
            eventName,
            headless,
            inspectEventDto,
            project.settings.authentication.username,
            project.settings.authentication.password
          );
        })
      )
      .subscribe((res) => {
        console.log('res', res);
        // update the report details
        const updatedEvent: IReportDetails = (res as any)[0];
        testDataSource.data = testDataSource.data.map((item) => {
          if (item.eventName === updatedEvent.eventName) {
            return updatedEvent;
          }
          return item;
        });

        this.projectDataSourceService.setData(testDataSource.data);
        this.isRunningTestSubject.next(false);
        this.eventRunningTestSubject.next('');
      });
  }
}
