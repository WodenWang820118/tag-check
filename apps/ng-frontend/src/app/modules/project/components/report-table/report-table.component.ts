import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  viewChild
} from '@angular/core';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { tap, take, Subscription } from 'rxjs';
import { IReportDetails } from '@utils';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { ProgressPieChartComponent } from '../progress-pie-chart/progress-pie-chart.component';
import { ReportTableFacadeService } from './report-table-facade.service';
import { TableSortService } from '../../../../shared/services/utils/table-sort.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-report-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    MatPaginatorModule,
    MatInputModule,
    MatCheckboxModule,
    MatBadgeModule,
    MatSnackBarModule,
    ProgressPieChartComponent,
    MatTooltipModule,
    MatChipsModule,
    CommonModule
  ],
  templateUrl: './report-table.component.html',
  styleUrls: ['./report-table.component.scss']
})
export class ReportTableComponent implements OnInit, OnDestroy {
  private readonly paginator = viewChild<MatPaginator>(MatPaginator);
  private readonly sort = viewChild<MatSort>(MatSort);
  private readonly reportTable =
    viewChild<MatTable<IReportDetails>>('reportTable');
  protected routeDataSubscription!: Subscription;

  constructor(
    public testRunningFacadeService: TestRunningFacadeService,
    private readonly route: ActivatedRoute,
    private readonly destroyRef: DestroyRef,
    private readonly facade: ReportTableFacadeService,
    private readonly tableSortService: TableSortService,
    private readonly cdr: ChangeDetectorRef,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.routeDataSubscription = this.route.data
      .pipe(
        tap((data) => {
          console.warn('data: ', data);
          // Read the latest viewChild values at the time of data emission
          const paginator = this.paginator();
          const sort = this.sort();
          if (paginator && sort) {
            this.facade.initializeData(paginator, sort, data);
          } else {
            // Defer once to allow view init to complete, then try again
            queueMicrotask(() => {
              const p = this.paginator();
              const s = this.sort();
              if (p && s) {
                this.facade.initializeData(p, s, data);
              }
            });
          }
        })
      )
      .subscribe();
  }

  sortData(sort: Sort) {
    this.dataSource.data = this.tableSortService.sortData(
      sort,
      this.dataSource.data,
      [
        { name: 'testName', type: 'string' },
        { name: 'eventName', type: 'string' },
        {
          name: 'status',
          type: 'number',
          accessor: (row: IReportDetails) => {
            const run = (row?.updatedAt ?? 0) > (row?.createdAt ?? 0);
            const dl = !!row?.passed;
            const req = !!row?.requestPassed;
            // Order: Passed (3) > Partial (2) > Failed (1) > Not run (0)
            if (!run) return 0;
            if (dl && req) return 3;
            if (dl || req) return 2;
            return 1;
          }
        },
        {
          name: 'completedTime',
          type: 'date',
          accessor: (row: IReportDetails) =>
            (row?.updatedAt ?? 0) > (row?.createdAt ?? 0) ? row?.updatedAt : 0
        }
      ]
    );
  }

  // The following getters make it easier to use signals in the template:
  get columns() {
    return this.facade.columns();
  }

  get columnsWithExpand() {
    return this.facade.columnsWithExpand();
  }

  get dataSource() {
    return this.facade.dataSource();
  }

  get selection() {
    return this.facade.selection();
  }

  get isAllSelected() {
    return this.facade.isAllSelected();
  }

  hasRecording(eventId: string) {
    return this.facade.hasRecording(eventId);
  }

  // Expose methods directly:
  runTest(eventId: string) {
    this.facade
      .runTest(eventId)
      .pipe(take(1))
      .subscribe((updatedData) => {
        // Ensure the material table updates immediately with new data
        console.log('Test result received, updating table:', updatedData);
        queueMicrotask(() => {
          this.reportTable()?.renderRows();
          this.cdr.detectChanges();
        });

        // Notify user of test result using MatSnackBar
        try {
          const row = updatedData?.data?.find((r) => r.eventId === eventId);
          if (row) {
            const dl = row.passed;
            const req = row.requestPassed;
            const status =
              dl && req ? 'passed' : dl || req ? 'partial' : 'failed';
            const message = `Test (${row.eventName}) ${status}. DataLayer: ${dl ? '✓' : '✗'}, Request: ${req ? '✓' : '✗'}`;
            this.snackBar.open(message, 'Close', {
              duration: 10000,
              horizontalPosition: 'right',
              verticalPosition: 'bottom',
              panelClass:
                status === 'passed'
                  ? 'snackbar-success'
                  : status === 'partial'
                    ? 'snackbar-warn'
                    : 'snackbar-error'
            });
          }
        } catch {
          // ignore snackbar errors
        }
      });
  }

  // Status filter wrappers for the template
  setStatusFilter(status: 'all' | 'notRun' | 'failed' | 'partial' | 'passed') {
    this.facade.setStatusFilter(status);
  }

  get statusFilter() {
    return this.facade.statusFilter();
  }

  toggleAllRows() {
    this.facade.toggleAllRows();
  }

  /** Toggle selection of a single row via facade */
  toggleSelection(row: IReportDetails) {
    this.facade.toggleRow(row);
  }

  checkboxLabel(row?: IReportDetails) {
    return this.facade.checkboxLabel(row);
  }

  ngOnDestroy() {
    this.routeDataSubscription.unsubscribe();
  }
}
