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
  filter
} from 'rxjs';
import { ReportService } from '../api/report/report.service';
import { SelectionModel } from '@angular/cdk/collections';
import { IReportDetails } from '@utils';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { InformationDialogComponent } from '../../components/information-dialog/information-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Injectable()
export class DataSourceFacadeService {
  constructor(
    private route: ActivatedRoute,
    private projectDataSourceService: ProjectDataSourceService,
    private reportService: ReportService,
    private settingsService: SettingsService,
    private dialog: MatDialog
  ) {}

  observeProject(paginator: MatPaginator, sort: MatSort) {
    return this.route.params.pipe(
      filter((params: { [key: string]: any }) => !!params['projectSlug']), // Only proceed if projectSlug exists
      map((params) => params['projectSlug']),
      switchMap((slug) => {
        return this.reportService.getProjectReports(slug).pipe(
          map((project) => {
            if (!project) {
              console.warn('No project data received');
              return null;
            }

            if (!paginator || !sort) {
              console.warn('Paginator or Sort not available');
              return null;
            }

            const injectReports = project.reports.sort((a, b) => {
              if (a.eventName < b.eventName) return -1;
              if (a.eventName > b.eventName) return 1;
              return 0;
            });

            const testDataSource = this.initializeDataSource(
              injectReports,
              paginator,
              sort
            );
            if (testDataSource) {
              console.log('Test Data Source Successful: ', testDataSource);
            }
            return testDataSource;
          }),
          catchError((error) => {
            console.error('Error processing project data:', error);
            return of(null);
          })
        );
      }),
      filter((dataSource) => !!dataSource) // Only emit when we have a valid data source
    );
  }

  private initializeDataSource(
    reports: IReportDetails[],
    paginator: MatPaginator,
    sort: MatSort
  ): MatTableDataSource<IReportDetails> {
    const dataSource = new MatTableDataSource(reports);
    dataSource.paginator = paginator;
    dataSource.sort = sort;
    return dataSource;
  }

  observePreventNavigationSelected(selection: SelectionModel<IReportDetails>) {
    return combineLatest([
      this.route.params,
      this.projectDataSourceService.getPreventNavigationStream(),
      selection.changed
    ]).pipe(
      switchMap(([params, value, selectionChanges]) => {
        if (selectionChanges.added.length === 0) return of(null);
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
              preventNavigationEvents: eventIds
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
      selection.changed
    ]).pipe(
      mergeMap(([params, value, selectionChanges]) => {
        // after report deletion the reset deleted stream ensures that no further deletion occurs
        // so that the dialog is not opened again
        if (selectionChanges.added.length === 0)
          return of({ params, dialogResult: false });
        if (value === false) {
          return of({ params, dialogResult: false });
        } else {
          const dialogRef = this.dialog.open(InformationDialogComponent, {
            data: {
              title: 'Delete Reports',
              contents: 'Are you sure you want to delete the selected reports?',
              action: 'Delete',
              actionColor: 'warn',
              consent: false
            }
          });

          return dialogRef.afterClosed().pipe(
            take(1),
            map((result) => {
              this.projectDataSourceService.setDeletedStream(false);
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
