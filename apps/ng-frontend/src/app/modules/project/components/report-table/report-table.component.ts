import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  inject,
  untracked,
  viewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import {
  getCheckStatus,
  IReportDetails,
  ReportDetailResponse,
  RunStatus
} from '@utils';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatBadgeModule } from '@angular/material/badge';
import { ProjectDataSourceService } from '../../../../shared/services/data-source/project-data-source.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { ProgressPieChartComponent } from '../progress-pie-chart/progress-pie-chart.component';
import { ReportTableFacadeService } from './report-table-facade.service';
import { TableSortService } from '../../../../shared/services/utils/table-sort.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { RunStatusChipComponent } from '../run-status-chip/run-status-chip.component';
import { getLastRunAt, getRunStatus } from '../report-detail.contracts';
import { BatchRunService } from '../../services/batch-run/batch-run.service';
import { StatusFilter } from './report-filter';

/** Sort order of the status column: Passed first, Not run last. */
const STATUS_ORDER: Record<RunStatus, number> = {
  passed: 3,
  partial: 2,
  failed: 1,
  notRun: 0
};

const SNACKBAR_CLASSES: Record<Exclude<RunStatus, 'notRun'>, string> = {
  passed: 'snackbar-success',
  partial: 'snackbar-warn',
  failed: 'snackbar-error'
};

/**
 * The project's tests: status and text filters, selection, sorting,
 * pagination and the play button of each row. The rows live in
 * ReportTableDataSourceModelService, shared with the toolbar and the batch
 * run; ReportTableFacadeService builds them from the route's data.
 */
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
    RunStatusChipComponent,
    CommonModule
  ],
  templateUrl: './report-table.component.html',
  styleUrls: ['./report-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager
})
export class ReportTableComponent {
  readonly testRunningFacadeService = inject(TestRunningFacadeService);
  readonly batchRunService = inject(BatchRunService);
  private readonly facade = inject(ReportTableFacadeService);
  private readonly tableSortService = inject(TableSortService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly projectDataSourceService = inject(ProjectDataSourceService);
  private readonly paginator = viewChild<MatPaginator>(MatPaginator);
  private readonly sort = viewChild<MatSort>(MatSort);
  private readonly routeData = toSignal(inject(ActivatedRoute).data);

  constructor() {
    // Rebuild the table on every resolve, not only the first: switching
    // project in the toolbar reuses this component and only resolves the
    // new project's tests. The view queries resolve after the first render,
    // so the effect also waits for the paginator and the sort.
    effect(() => {
      const data = this.routeData();
      const paginator = this.paginator();
      const sort = this.sort();
      if (data && paginator && sort) {
        // initializeData reads the filter signals; they must not re-run this.
        untracked(() => this.facade.initializeData(paginator, sort, data));
      }
    });
  }

  /** The single status a row shows: Passed, Partial, Failed or Not run. */
  runStatus(report: IReportDetails): RunStatus {
    return getRunStatus(report);
  }

  /** When the row's latest run ran; undefined before the first run. */
  lastRunAt(report: IReportDetails) {
    return getLastRunAt(report);
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
          accessor: (row: IReportDetails) => STATUS_ORDER[getRunStatus(row)]
        },
        {
          name: 'completedTime',
          type: 'date',
          accessor: (row: IReportDetails) => getLastRunAt(row) ?? 0
        }
      ]
    );
  }

  // Getters let the template read the facade's signals.
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

  isSavingNavigation() {
    return this.projectDataSourceService.getPreventNavigationSignal();
  }

  /** Runs one test; its row updates when the run ends, then a snackbar says how it went. */
  async runTest(eventId: string): Promise<void> {
    if (this.isSavingNavigation()) return;
    try {
      const report = await firstValueFrom(this.facade.runTest(eventId));
      if (report) {
        this.showSnack(report);
      }
    } catch {
      // error handled in facade/services
    }
  }

  setStatusFilter(status: StatusFilter) {
    this.facade.setStatusFilter(status);
  }

  get statusFilter() {
    return this.facade.statusFilter();
  }

  toggleAllRows() {
    this.facade.toggleAllRows();
  }

  toggleSelection(row: IReportDetails) {
    this.facade.toggleRow(row);
  }

  checkboxLabel(row?: IReportDetails) {
    return this.facade.checkboxLabel(row);
  }

  // Keeps row elements across data source replacements after each run.
  trackByEventId(_index: number, row: IReportDetails) {
    return row.eventId;
  }

  private showSnack(report: ReportDetailResponse) {
    const dl = report.testEventDetails?.passed === true;
    const req = report.testEventDetails?.requestPassed === true;
    const checked = report.testEventDetails?.requestChecked !== false;
    const status = getCheckStatus(dl, req, checked);
    const request = !checked ? 'not checked' : req ? '✓' : '✗';
    this.snackBar.open(
      `Test (${report.testEvent.eventName}) ${status}. DataLayer: ${dl ? '✓' : '✗'}, Request: ${request}`,
      'Close',
      {
        duration: 10000,
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
        panelClass: SNACKBAR_CLASSES[status]
      }
    );
  }
}
