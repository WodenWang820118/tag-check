import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EMPTY, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { IReportDetails } from '@utils';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatBadgeModule } from '@angular/material/badge';
import { DataSourceFacadeService } from '../../../../shared/services/facade/data-source-facade.service';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { ProjectFacadeService } from '../../../../shared/services/facade/project-facade.service';
import { ProgressPieChartComponent } from '../progress-pie-chart/progress-pie-chart.component';

@Component({
  selector: 'app-report-table',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    NgClass,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    MatPaginatorModule,
    MatInputModule,
    MatCheckboxModule,
    MatBadgeModule,
    ProgressPieChartComponent,
  ],
  providers: [
    ProjectFacadeService,
    DataSourceFacadeService,
    TestRunningFacadeService,
  ],
  templateUrl: './report-table.component.html',
  styleUrls: ['./report-table.component.scss'],
})
export class ReportTableComponent implements AfterViewInit, OnDestroy {
  columnsToDisplay = [
    'testName',
    'eventName',
    'passed',
    'requestPassed',
    'completedTime',
  ];
  columnsToDisplayWithExpand = ['select', ...this.columnsToDisplay, 'actions'];
  expandedElement: Report | null = null;
  testDataSource!: MatTableDataSource<IReportDetails>;
  selection = new SelectionModel<IReportDetails>(true, []);
  preventNavigationEvents: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  destroy$ = new Subject<void>();

  constructor(
    public projectFacadeService: ProjectFacadeService,
    public dataSourceFacadeService: DataSourceFacadeService,
    public testRunningFacadeService: TestRunningFacadeService,
    private route: ActivatedRoute
  ) {}

  ngAfterViewInit() {
    this.observeProject().pipe(takeUntil(this.destroy$)).subscribe();

    this.observeProjectRecordingStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe();

    this.projectFacadeService
      .observeNavigationEvents()
      .pipe(
        takeUntil(this.destroy$),
        tap((preventNavigationEvents) => {
          this.preventNavigationEvents = preventNavigationEvents;
        })
      )
      .subscribe();

    this.dataSourceFacadeService
      .observeTableFilter()
      .pipe(
        takeUntil(this.destroy$),
        tap((filter) => {
          this.testDataSource.filter = filter;
        })
      )
      .subscribe();

    this.dataSourceFacadeService
      .observePreventNavigationSelected(this.selection)
      .pipe(
        takeUntil(this.destroy$),
        tap((projectSetting) => {
          if (!projectSetting) return;
          this.preventNavigationEvents =
            projectSetting.settings.preventNavigationEvents;
        })
      )
      .subscribe();
  }

  observeProjectRecordingStatus() {
    return this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap((params: Params) =>
        this.projectFacadeService.observeProjectRecordingStatus(
          params['projectSlug']
        )
      )
    );
  }

  observeProject() {
    return this.dataSourceFacadeService
      .observeProject(this.paginator, this.sort)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(
          (
            dataSource: MatTableDataSource<IReportDetails, MatPaginator> | null
          ) => {
            if (dataSource) {
              this.testDataSource = dataSource;
              return this.dataSourceFacadeService.observeDeleteSelected(
                this.selection,
                this.testDataSource
              );
            }
            return EMPTY;
          }
        )
      );
  }

  runTest(eventId: string) {
    this.route.params
      .pipe(
        take(1),
        switchMap((params: Params) => {
          return this.testRunningFacadeService.runTest(
            eventId,
            params['projectSlug'],
            this.testDataSource
          );
        })
      )
      .subscribe((updatedData) => {
        if (updatedData) {
          this.testDataSource.data = [...updatedData.data];
        }
      });
  }

  selectSingleRow(row: IReportDetails) {
    this.selection.toggle(row);
    this.selection.select(row);
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    if (!this.testDataSource) {
      return;
    }

    const numSelected = this.selection.selected.length;
    const numRows = this.testDataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.testDataSource.data);
    console.log('selected', this.selection.selected);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: IReportDetails): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }

  ngOnDestroy() {
    console.log('destroying report-table');
    this.destroy$.next();
    this.destroy$.complete();
  }
}
