import { Injectable, signal, computed } from '@angular/core';
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

@Injectable({ providedIn: 'root' })
export class ReportTableFacadeService {
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

  readonly expandedElement = signal<Report | null>(null);
  private readonly projectSlug = signal<string>('');
  private readonly hasRecordingMap: Map<string, boolean> = new Map();
  private paginatorPageSubscription: Subscription | null = null;
  // Status filter: all | notRun | failed | partial | passed
  readonly statusFilter = signal<
    'all' | 'notRun' | 'failed' | 'partial' | 'passed'
  >('all');

  constructor(
    private readonly projectDataSourceService: ProjectDataSourceService,
    private readonly testRunningFacadeService: TestRunningFacadeService,
    private readonly reportTableDataSourceModelService: ReportTableDataSourceModelService,
    private readonly selectionFacade: ReportTableSelectionFacadeService,
    private readonly effectsFacade: ReportTableEffectsFacadeService
  ) {
    this.effectsFacade.initialize({
      getStatus: () => this.statusFilter(),
      getProjectSlug: () => this.projectSlug()
    });
  }

  //#region Initialization
  initializeData(
    paginator: MatPaginator,
    sort: MatSort,
    data: Record<string, unknown>
  ) {
    console.log('Initializing report table with data:', data);
    const reports = (data['projectReport'] || []) as IReportDetails[];
    const toDate = (
      d: Date | string | number | undefined | null
    ): Date | undefined => (d != null ? new Date(d) : undefined);
    const normalize = (r: IReportDetails): IReportDetails => ({
      ...r,
      passed: r.passed === true,
      requestPassed: r.requestPassed === true,
      createdAt: toDate(r.createdAt) ?? new Date(0),
      updatedAt: toDate(r.updatedAt)
    });
    const normalizedReports = reports.map(normalize);

    if (paginator && sort) {
      // Sort the data
      const injectReports = [...normalizedReports].sort((a, b) =>
        a.eventName.localeCompare(b.eventName)
      );
      // Create data source and assign
      const dataSource = new MatTableDataSource([...injectReports]);

      const slug = data['projectSlug'] as string | undefined;
      // Try to restore saved page size and page index for this project from localStorage
      this.restorePaginatorStateForProject(paginator, slug);

      dataSource.paginator = paginator;
      dataSource.sort = sort;
      // Initialize filter predicate and filter value using current signals
      dataSource.filterPredicate = this.createFilterPredicate();
      dataSource.filter = JSON.stringify({
        text: this.projectDataSourceService.getFilterSignal(),
        status: this.statusFilter()
      });
      this.reportTableDataSourceModelService.dataSource.set(dataSource);
      this.projectSlug.set(data['projectSlug'] as string);

      // Subscribe to paginator page events to persist pageSize changes per project
      this.subscribeToPersistPaginatorState(paginator, slug);
    }
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

  //#region Filtering
  private createFilterPredicate() {
    return (row: IReportDetails, filterStr: string) => {
      let parsed: { text?: string; status?: string } = {};
      try {
        parsed = JSON.parse(filterStr || '{}');
      } catch {
        parsed = { text: filterStr || '' };
      }
      const t = (parsed.text || '').toLowerCase();
      const s = (parsed.status || 'all') as ReturnType<
        typeof this.statusFilter
      >;

      const haystack =
        `${row.testName ?? ''} ${row.eventName ?? ''}`.toLowerCase();
      const textMatch = !t || haystack.includes(t);

      const u = row?.updatedAt ? new Date(row.updatedAt).getTime() : 0;
      const c = row?.createdAt ? new Date(row.createdAt).getTime() : 0;
      const run = u > c;
      const dl = row?.passed === true;
      const req = row?.requestPassed === true;
      let statusKey: 'notRun' | 'failed' | 'partial' | 'passed';
      if (!run) statusKey = 'notRun';
      else if (dl && req) statusKey = 'passed';
      else if (dl || req) statusKey = 'partial';
      else statusKey = 'failed';
      const statusMatch = s === 'all' || s === statusKey;

      return textMatch && statusMatch;
    };
  }
  //#endregion

  //#region Actions
  runTest(eventId: string) {
    const projectSlug = this.projectSlug();
    return this.testRunningFacadeService.runTest(
      eventId,
      projectSlug,
      this.reportTableDataSourceModelService.dataSource()
    );
  }

  hasRecording(eventId: string): boolean {
    return this.hasRecordingMap.get(eventId) || false;
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

  get selectionSignal() {
    return this.reportTableDataSourceModelService.selection;
  }

  get selection() {
    return this.reportTableDataSourceModelService.computedSelection;
  }

  // Status filter API for component
  setStatusFilter(status: 'all' | 'notRun' | 'failed' | 'partial' | 'passed') {
    this.statusFilter.set(status);
  }

  isAllSelected(): boolean {
    return this.selectionFacade.isAllSelected();
  }
  //#endregion
}
