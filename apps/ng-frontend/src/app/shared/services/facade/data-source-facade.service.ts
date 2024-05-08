import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SettingsService } from '../api/settings/settings.service';
import { ProjectDataSourceService } from '../project-data-source/project-data-source.service';
import { combineLatest, switchMap, EMPTY, tap, map } from 'rxjs';
import { ReportService } from '../api/report/report.service';
import { SelectionModel } from '@angular/cdk/collections';
import { IReportDetails } from '@utils';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ReportDetailsService } from '../report-details/report-details.service';

@Injectable()
export class DataSourceFacadeService {
  constructor(
    private route: ActivatedRoute,
    private projectDataSourceService: ProjectDataSourceService,
    private reportService: ReportService,
    private reportDetailsService: ReportDetailsService,
    private settingsService: SettingsService
  ) {}

  observeProject(paginator: MatPaginator, sort: MatSort) {
    // when the route changes, get the project reports and initialize the data source
    // otherwise, update the data source when the project reports change

    return combineLatest([this.route.params]).pipe(
      switchMap(([params]) => {
        const slug = params['projectSlug'];
        return this.reportService.getProjectReports(slug).pipe(
          map((project) => {
            const injectReports = project.reports.sort((a, b) => {
              if (a.eventName < b.eventName) return -1;
              if (a.eventName > b.eventName) return 1;
              return 0;
            });
            if (project) {
              const testDataSource = this.initializeDataSource(
                injectReports,
                paginator,
                sort
              );
              return testDataSource;
            } else {
              return null;
            }
          })
        );
      })
    );
  }

  observePreventNavigationSelected(selection: SelectionModel<IReportDetails>) {
    return combineLatest([
      this.route.params,
      this.projectDataSourceService.getPreventNavigationStream(),
    ]).pipe(
      switchMap(([params, value]) => {
        const projectSlug = params['projectSlug'];
        if (value === true) {
          // reset the prevent navigation stream
          this.projectDataSourceService.setPreventNavigationStream(false);
          // delete the selected reports
          const eventIds = selection.selected.map((item) => item.eventId);
          selection.clear();
          return this.settingsService.updateSettings(
            projectSlug,
            'preventNavigationEvents',
            {
              preventNavigationEvents: eventIds,
            }
          );
        }
        return EMPTY;
      })
    );
  }

  observeDeleteSelected(
    selection: SelectionModel<IReportDetails>,
    testDataSource: MatTableDataSource<IReportDetails, MatPaginator>
  ) {
    return combineLatest([
      this.route.params,
      this.projectDataSourceService.getDeletedStream(),
    ]).pipe(
      switchMap(([params, value]) => {
        const projectSlug = params['projectSlug'];

        if (value === true) {
          console.log('delete selected in the report table component');
          // reset the deleted stream
          this.projectDataSourceService.setDeletedStream(false);
          // delete the selected reports
          const remainingReports = testDataSource.data.filter(
            (item) => !selection.selected.includes(item)
          );
          testDataSource.data = remainingReports;
          this.projectDataSourceService.setData(remainingReports);
          return this.reportService.deleteReports(
            projectSlug,
            selection.selected
          );
        }
        return EMPTY;
      }),
      tap(() => {
        selection.clear();
      })
    );
  }

  initializeDataSource(
    reports: IReportDetails[],
    paginator: MatPaginator,
    sort: MatSort
  ) {
    const testDataSource = new MatTableDataSource(reports);
    // Make sure to set paginator and sort after view init
    testDataSource.paginator = paginator;
    testDataSource.sort = sort;
    this.projectDataSourceService.setData(reports);
    return testDataSource;
  }

  setReportDetails(eventId: string) {
    this.route.params
      .pipe(
        switchMap((params) => {
          const slug = params['projectSlug'];
          return this.reportService.getProjectReports(slug).pipe(
            tap((project) => {
              if (project) {
                const reports = project.reports;
                const report = reports.find((item) => item.eventId === eventId);
                this.reportDetailsService.setReportDetails(report);
              }
            })
          );
        })
      )
      .subscribe();
  }

  observeTableFilter() {
    return this.projectDataSourceService.getFilterStream().pipe(
      map((filter) => {
        return filter;
      })
    );
  }
}
