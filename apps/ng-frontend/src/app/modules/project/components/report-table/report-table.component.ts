// #region imports
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  signal,
  effect,
  computed,
  viewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { tap, take } from 'rxjs';
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
// #endregion

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
  styleUrls: ['./report-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ReportTableComponent implements OnInit {
  // #region viewChild / signals
  private readonly paginator = viewChild<MatPaginator>(MatPaginator);
  private readonly sort = viewChild<MatSort>(MatSort);
  private readonly reportTable =
    viewChild<MatTable<IReportDetails>>('reportTable');
  private readonly isUpdating = signal(false);
  private readonly isUpdating$ = computed(() => this.isUpdating());
  private readonly updatedData = signal<Record<string, unknown> | undefined>(
    undefined
  );
  private readonly updatedData$ = computed(() => this.updatedData());
  // #endregion

  constructor(
    public testRunningFacadeService: TestRunningFacadeService,
    private readonly route: ActivatedRoute,
    private readonly facade: ReportTableFacadeService,
    private readonly tableSortService: TableSortService,
    private readonly snackBar: MatSnackBar
  ) {
    // #region constructor effects
    effect(() => {
      const isUpdating = this.isUpdating$();
      if (isUpdating) {
        console.log('Updating table...');
        const paginator = this.paginator();
        const sort = this.sort();
        const updatedData = this.updatedData$();
        const originalData = this.dataSource.data;
        console.log('Data source before update:', originalData);
        if (paginator && sort && updatedData) {
          const newData = [
            ...(updatedData['projectReport'] as IReportDetails[])
          ];

          // Normalize and merge by eventId (avoid duplicates with stale state)
          const toDate = (
            d: Date | string | number | undefined | null
          ): Date | undefined => (d != null ? new Date(d) : undefined);
          const normalize = (r: IReportDetails): IReportDetails => ({
            ...r,
            // ensure booleans are real booleans (not 'true'/'false' strings)
            passed: r.passed === true,
            requestPassed: r.requestPassed === true,
            createdAt: toDate(r.createdAt) ?? new Date(0),
            updatedAt: toDate(r.updatedAt)
          });
          const merged = new Map<string, IReportDetails>();
          for (const r of originalData) merged.set(r.eventId, normalize(r));
          for (const r of newData) merged.set(r.eventId, normalize(r));
          const mergedList = Array.from(merged.values());
          console.log('newData: ', newData);
          this.dataSource.data = mergedList;
          this.isUpdating.set(false);
          try {
            this.reportTable()?.renderRows();
          } catch {
            // Ignore errors from renderRows if table not yet available
          }
          console.log('Table update complete.');
        }
      }
    });
    // #endregion
  }

  ngOnInit() {
    // #region lifecycle
    this.route.data
      .pipe(
        take(1),
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
    // #endregion
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
            const u = row?.updatedAt ? new Date(row.updatedAt).getTime() : 0;
            const c = row?.createdAt ? new Date(row.createdAt).getTime() : 0;
            const run = u > c;
            const dl = row?.passed === true;
            const req = row?.requestPassed === true;
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
          accessor: (row: IReportDetails) => {
            const u = row?.updatedAt ? new Date(row.updatedAt).getTime() : 0;
            const c = row?.createdAt ? new Date(row.createdAt).getTime() : 0;
            return u > c ? row?.updatedAt : 0;
          }
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
        console.log('Test result received, updating table:', updatedData.data);
        // #region update table after run
        this.isUpdating.set(true);
        this.updatedData.set({
          projectReport: updatedData.data.filter(
            (event) => eventId === event.eventId
          ),
          projectSlug: this.route.snapshot.paramMap.get('projectSlug')
        });
        this.maybeShowSnackForEvent(updatedData, eventId);
        // #endregion
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

  // Help MatTable identify rows for efficient updates
  trackByEventId(_index: number, row: IReportDetails) {
    return row.eventId;
  }
  // #region private helpers (snackbar etc.)
  private maybeShowSnackForEvent(
    updatedData: { data: IReportDetails[] } | undefined,
    eventId: string
  ) {
    const row = updatedData?.data?.find((r) => r.eventId === eventId);
    if (row) this.showSnack(row);
  }

  private showSnack(row: IReportDetails) {
    try {
      const dl = row.passed === true;
      const req = row.requestPassed === true;
      const status = this.computeStatus(dl, req);
      const message = this.buildSnackMessage(row.eventName, status, dl, req);
      const panelClass = this.classForStatus(status);
      this.snackBar.open(message, 'Close', {
        duration: 10000,
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
        panelClass
      });
    } catch {
      // ignore snackbar errors
    }
  }

  private computeStatus(dl: boolean, req: boolean) {
    if (dl && req) return 'passed' as const;
    if (dl || req) return 'partial' as const;
    return 'failed' as const;
  }

  private buildSnackMessage(
    eventName: string,
    status: 'passed' | 'partial' | 'failed',
    dl: boolean,
    req: boolean
  ) {
    return `Test (${eventName}) ${status}. DataLayer: ${dl ? '✓' : '✗'}, Request: ${req ? '✓' : '✗'}`;
  }

  private classForStatus(status: 'passed' | 'partial' | 'failed') {
    if (status === 'passed') return 'snackbar-success';
    if (status === 'partial') return 'snackbar-warn';
    return 'snackbar-error';
  }
  // #endregion
}
