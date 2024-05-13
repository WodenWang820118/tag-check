import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SettingsService } from '../api/settings/settings.service';
import { ProjectDataSourceService } from '../project-data-source/project-data-source.service';
import {
  combineLatest,
  switchMap,
  EMPTY,
  tap,
  map,
  mergeMap,
  take,
  catchError,
  of,
} from 'rxjs';
import { ReportService } from '../api/report/report.service';
import { SelectionModel } from '@angular/cdk/collections';
import { IReportDetails } from '@utils';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ReportDetailsService } from '../report-details/report-details.service';
import { InformationDialogComponent } from '../../components/information-dialog/information-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Injectable()
export class DataSourceFacadeService {
  constructor(
    private route: ActivatedRoute,
    private projectDataSourceService: ProjectDataSourceService,
    private reportService: ReportService,
    private reportDetailsService: ReportDetailsService,
    private settingsService: SettingsService,
    private dialog: MatDialog
  ) {}

  observeProject(paginator: MatPaginator, sort: MatSort) {
    // when the route changes, get the project reports and initialize the data source
    // otherwise, update the data source when the project reports change

    return combineLatest([this.route.params]).pipe(
      switchMap(([params]) => {
        const slug = params['projectSlug'];
        return this.reportService.getProjectReports(slug).pipe(
          map((project) => {
            if (!project) return null;
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
          }),
          catchError((error) => {
            console.error(error);
            return of(null);
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
      }),
      catchError((error) => {
        console.error(error);
        return of(null);
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
      mergeMap(([params, value]) => {
        // after report deletion the reset deleted stream ensures that no further deletion occurs
        // so that the dialog is not opened again
        if (value === false) {
          return of({ params, dialogResult: false });
        } else {
          const dialogRef = this.dialog.open(InformationDialogComponent, {
            data: {
              title: 'Delete Reports',
              contents: 'Are you sure you want to delete the selected reports?',
              action: 'Delete',
              actionColor: 'warn',
              consent: false,
            },
          });

          return dialogRef.afterClosed().pipe(
            take(1),
            map((result) => {
              return { params, dialogResult: result };
            })
          );
        }
      }),
      switchMap(({ params, dialogResult }) => {
        const projectSlug = params['projectSlug'];
        if (dialogResult === true) {
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
      }),
      catchError((error) => {
        console.error(error);
        return of(null);
      })
    );
  }

  initializeDataSource(
    reports: IReportDetails[],
    paginator: MatPaginator,
    sort: MatSort
  ) {
    try {
      const testDataSource = new MatTableDataSource(reports);
      // Make sure to set paginator and sort after view init
      testDataSource.paginator = paginator;
      testDataSource.sort = sort;
      this.projectDataSourceService.setData(reports);
      return testDataSource;
    } catch (error) {
      console.error(error);
      return null;
    }
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
        }),
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      )
      .subscribe();
  }

  observeTableFilter() {
    return this.projectDataSourceService.getFilterStream().pipe(
      map((filter) => {
        return filter;
      }),
      catchError((error) => {
        console.error(error);
        return of('');
      })
    );
  }
}
