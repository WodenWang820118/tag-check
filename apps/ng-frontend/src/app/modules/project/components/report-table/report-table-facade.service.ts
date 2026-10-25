import { SelectionModel } from '@angular/cdk/collections';
import { Injectable, inject, signal, computed } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { IReportDetails } from '@utils';
import { ProjectDataSourceService } from '../../../../shared/services/data-source/project-data-source.service';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ReportTableDataSourceModelService } from '../../services/report-table-data-source-model/report-table-data-source-model.service';
import { ReportTableSelectionFacadeService } from './services/report-table-selection-facade/report-table-selection-facade.service';
import { ReportTableEffectsFacadeService } from './services/report-table-effects-facade/report-table-effects-facade.service';
import { RunHeadlessService } from '../../services/run-headless/run-headless.service';
import {
  reportFilterPredicate,
  StatusFilter,
  toReportFilter
} from './report-filter';

/**
 * The tests table's state and actions: builds the rows from the route's
 * data, keeps the status filter and, per project, the page size, and
 * runs a test.
 */
@Injectable({ providedIn: 'root' })
export class ReportTableFacadeService {
  private readonly projectDataSourceService = inject(ProjectDataSourceService);
  private readonly testRunningFacadeService = inject(TestRunningFacadeService);
  private readonly reportTableDataSourceModelService = inject(
    ReportTableDataSourceModelService
  );
  private readonly runHeadlessService = inject(RunHeadlessService);
  private readonly selectionFacade = inject(ReportTableSelectionFacadeService);
  private readonly effectsFacade = inject(ReportTableEffectsFacadeService);
  readonly columns = signal([
    'testName',
    'eventName',
    'status',
    'completedTime'
  ]);

  readonly columnsWithExpand = computed(() => [
    'select',
    ...this.columns(),
    'actions'
  ]);

  private readonly projectSlug = signal<string>('');
  readonly projectSlug$ = this.projectSlug.asReadonly();
  private paginatorPageSubscription: Subscription | null = null;
  readonly statusFilter = signal<StatusFilter>('all');

  constructor() {
    this.effectsFacade.initialize({
      getStatus: () => this.statusFilter(),
      getProjectSlug: () => this.projectSlug()
    });
  }

  //#region Initialization
  /**
   * Builds the tests table from the route's data: `projectReport` is
   * GET /reports/:projectSlug, as JSON (dates are strings), and
   * `projectSlug` the project. Called again when the project changes; the
   * previous project's selection and page are dropped.
   */
  initializeData(
    paginator: MatPaginator,
    sort: MatSort,
    data: Record<string, unknown>
  ) {
    const reports = (data['projectReport'] || []) as IReportDetails[];
    const toDate = (
      d: Date | string | number | undefined | null
    ): Date | undefined => (d == null ? undefined : new Date(d));
    const rows = reports
      .map((r): IReportDetails => ({
        ...r,
        passed: r.passed === true,
        requestPassed: r.requestPassed === true,
        createdAt: toDate(r.createdAt) ?? new Date(0),
        updatedAt: toDate(r.updatedAt)
      }))
      .sort((a, b) => a.eventName.localeCompare(b.eventName));
    const dataSource = new MatTableDataSource(rows);

    const slug = data['projectSlug'] as string | undefined;
    // A reused paginator still shows the previous project's page.
    paginator.pageIndex = 0;
    this.restorePaginatorStateForProject(paginator, slug);

    dataSource.paginator = paginator;
    dataSource.sort = sort;
    dataSource.filterPredicate = reportFilterPredicate;
    dataSource.filter = toReportFilter(
      this.projectDataSourceService.getFilterSignal(),
      this.statusFilter()
    );
    this.reportTableDataSourceModelService.dataSource.set(dataSource);
    // Selected rows are row objects of the previous table: drop them, or
    // the toolbar would act on tests the table no longer shows.
    this.reportTableDataSourceModelService.selection.set(
      new SelectionModel<IReportDetails>(true, [])
    );
    this.projectSlug.set(slug ?? '');

    this.subscribeToPersistPaginatorState(paginator, slug);
  }
  //#endregion

  //#region Paginator state persistence
  private getPageSizeKey(slug: string) {
    return `reportTable.pageSize.${slug}`;
  }

  private restorePaginatorStateForProject(
    paginator: MatPaginator,
    slug?: string
  ) {
    if (!slug) return;
    try {
      const key = this.getPageSizeKey(slug);
      const saved = localStorage.getItem(key);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        pageSize?: number;
        pageIndex?: number;
      } | null;
      if (!parsed) return;
      if (
        parsed.pageSize &&
        Number.isFinite(parsed.pageSize) &&
        parsed.pageSize > 0
      ) {
        paginator.pageSize = parsed.pageSize;
      }
      if (
        parsed.pageIndex &&
        Number.isFinite(parsed.pageIndex) &&
        parsed.pageIndex >= 0
      ) {
        paginator.pageIndex = parsed.pageIndex;
      }
    } catch {
      // ignore storage errors
    }
  }

  private subscribeToPersistPaginatorState(
    paginator: MatPaginator,
    slug?: string
  ) {
    if (this.paginatorPageSubscription) {
      this.paginatorPageSubscription.unsubscribe();
      this.paginatorPageSubscription = null;
    }
    if (!slug) return;
    const key = this.getPageSizeKey(slug);
    this.paginatorPageSubscription = paginator.page.subscribe(() => {
      try {
        const state = {
          pageSize: paginator.pageSize,
          pageIndex: paginator.pageIndex
        };
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        // ignore storage write errors
      }
    });
  }
  //#endregion

  //#region Actions
  /**
   * Runs a test of the current project, headless or not as the toolbar's
   * Run headless toggle says, and emits its report, or undefined when the
   * run returned none. The test's row is updated when the run ends.
   */
  runTest(eventId: string) {
    const projectSlug = this.projectSlug();
    return this.testRunningFacadeService.runTestForReport(
      eventId,
      projectSlug,
      { headless: this.runHeadlessService.headlessFor(projectSlug) }
    );
  }

  // Selection actions delegated to sub-facade
  toggleAllRows(): void {
    this.selectionFacade.toggleAllRows();
  }

  toggleRow(row: IReportDetails) {
    this.selectionFacade.toggleRow(row);
  }

  checkboxLabel(row?: IReportDetails): string {
    return this.selectionFacade.checkboxLabel(row);
  }

  get dataSource() {
    return this.reportTableDataSourceModelService.computedDataSource;
  }

  get selection() {
    return this.reportTableDataSourceModelService.computedSelection;
  }

  // Status filter API for component
  /** Applies the given status filter to narrow the visible report rows. */
  setStatusFilter(status: StatusFilter) {
    this.statusFilter.set(status);
  }

  /** Returns true when all visible rows are currently selected. */
  isAllSelected(): boolean {
    return this.selectionFacade.isAllSelected();
  }
  //#endregion
}
