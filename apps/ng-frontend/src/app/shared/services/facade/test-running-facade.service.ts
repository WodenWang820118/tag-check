import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataLayerService } from '../api/datalayer/datalayer.service';
import { GtmOperatorService } from '../api/gtm-operator/gtm-operator.service';
import {
  combineLatest,
  switchMap,
  Observable,
  BehaviorSubject,
  take,
} from 'rxjs';
import { InspectEventDto } from '../../../modules/project/components/report-table/utils';
import { IInspectEvent } from '../../models/inspectData.interface';
import { IReportDetails } from '../../models/report.interface';
import { Project } from '../../models/project.interface';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ProjectDataSourceService } from '../project-data-source/project-data-source.service';
import { QaRequestService } from '../api/qa-request/qa-request.service';

@Injectable({
  providedIn: 'root',
})
export class TestRunningFacadeService {
  isRunningTestSubject = new BehaviorSubject<boolean>(false);
  eventRunningTestSubject = new BehaviorSubject<string>('');

  isRunningTest$ = this.isRunningTestSubject.asObservable();
  eventRunningTest$ = this.eventRunningTestSubject.asObservable();

  constructor(
    private route: ActivatedRoute,
    private dataLayerService: DataLayerService,
    private gtmOperatorService: GtmOperatorService,
    private qaRequestService: QaRequestService,
    private projectDataSourceService: ProjectDataSourceService
  ) {}

  runTest(
    eventName: string,
    project$: Observable<Project>,
    testDataSource: MatTableDataSource<IReportDetails, MatPaginator>
  ) {
    combineLatest([this.route.params, project$])
      .pipe(
        take(1),
        switchMap(([params, project]) => {
          const slug = params['projectSlug'];
          const headless = project.headless;
          const inspectEventDto: IInspectEvent = new InspectEventDto(project);
          // change the play button to a spinner
          this.isRunningTestSubject.next(true);
          this.eventRunningTestSubject.next(eventName);

          // TODO: testing
          if (
            project.gtm.isAccompanyMode ||
            (project.gtm.isAccompanyMode && project.gtm.isRequestCheck)
          ) {
            const measurementId = project.gtm.isRequestCheck
              ? project.measurementId
              : undefined;
            return this.gtmOperatorService.runInspectionViaGtm(
              slug,
              eventName,
              project.gtm.gtmPreviewModeUrl,
              headless,
              inspectEventDto,
              measurementId,
              project.authentication.username,
              project.authentication.password
            );
          }

          if (project.gtm.isRequestCheck) {
            return this.qaRequestService.runDataLayerWithRequestCheck(
              slug,
              eventName,
              project.measurementId,
              headless,
              inspectEventDto,
              project.authentication.username,
              project.authentication.password
            );
          }

          return this.dataLayerService.runDataLayerInspection(
            slug,
            eventName,
            headless,
            inspectEventDto,
            project.authentication.username,
            project.authentication.password
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
