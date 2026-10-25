import { effect, inject, Injectable, signal } from '@angular/core';
import { FileTableDataSourceService } from '../../../../shared/services/data-source/file-table-data-source.service';
import { FileReportService } from '../../../../shared/services/api/file-report/file-report.service';
import { take } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { Jsonified, RunSummary } from '@utils';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { InformationDialogComponent } from '../../../../shared/components/information-dialog/information-dialog.component';
import { MatSort } from '@angular/material/sort';
import { FileTableDataSourceModelService } from '../../services/file-table-data-source-model/file-table-data-source-model.service';
import { SelectionModel } from '@angular/cdk/collections';
import { runFilterPredicate, toRunFilter } from './run-filter';

/**
 * The Reports page's runs: one row per run, newest first. The toolbar
 * asks for a delete or a download through FileTableDataSourceService's
 * signals; this service confirms it in a dialog and calls the API.
 */
@Injectable({
  providedIn: 'root'
})
export class FileTableDataSourceFacadeService {
  private readonly fileTableDataSourceService = inject(
    FileTableDataSourceService
  );
  private readonly fileTableDataSourceModelService = inject(
    FileTableDataSourceModelService
  );
  private readonly fileReportService = inject(FileReportService);
  private readonly dialog = inject(MatDialog);
  columns = signal(['select', 'eventName', 'status', 'completedTime']);
  private readonly projectSlug = signal<string>('');

  constructor() {
    // A page load replaces the data source, so the predicate is set again
    // on each one.
    effect(() => {
      const text = this.fileTableDataSourceService.getFilterSignal();
      const eventName = this.fileTableDataSourceService.getEventFilterSignal();
      const currentDataSource =
        this.fileTableDataSourceModelService.dataSource();
      if (currentDataSource) {
        currentDataSource.filterPredicate = runFilterPredicate;
        currentDataSource.filter = toRunFilter(text, eventName);
      }
    });
    effect(() => {
      const deletedSignal = this.fileTableDataSourceService.getDeletedSignal();
      if (deletedSignal) {
        const dialogRef = this.dialog.open(InformationDialogComponent, {
          data: {
            title: 'Delete runs',
            contents:
              'Delete the selected runs and their screenshots? The tests stay, and a test whose latest run is deleted shows its previous run.',
            action: 'Delete',
            actionColor: 'warn',
            consent: false
          }
        });
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.handleReportDeletion();
          }
          this.fileTableDataSourceService.setDeletedSignal(false);
        });
      }
    });
    effect(() => {
      const downloadSignal =
        this.fileTableDataSourceService.getDownloadSignal();
      if (downloadSignal) {
        const dialogRef = this.dialog.open(InformationDialogComponent, {
          data: {
            title: 'Download Reports',
            contents: 'Are you sure you want to download the selected reports?',
            action: 'Download',
            actionColor: 'primary',
            consent: false
          }
        });
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.handleReportDownload(
              this.projectSlug(),
              this.fileTableDataSourceModelService.selection().selected
            );
          }
          this.fileTableDataSourceService.setDownloadSignal(false);
        });
      }
    });
  }

  /**
   * Shows the runs the route resolved: one row per run, newest first, as
   * GET /file-reports/:projectSlug returns them.
   */
  initializeData(
    paginator: MatPaginator,
    sort: MatSort,
    data: { fileReports?: Jsonified<RunSummary>[] | null; projectSlug?: string }
  ) {
    const dataSource = new MatTableDataSource(data.fileReports ?? []);
    dataSource.paginator = paginator;
    dataSource.sort = sort;
    this.fileTableDataSourceModelService.dataSource.set(dataSource);
    this.fileTableDataSourceModelService.selection.set(
      new SelectionModel<Jsonified<RunSummary>>(true, [])
    );
    this.projectSlug.set(data.projectSlug ?? '');
  }

  /** Deletes the selected runs, then drops the rows the server deleted. */
  private handleReportDeletion() {
    const selection = this.fileTableDataSourceModelService.selection();
    const runIds = selection.selected.map((run) => run.runId);
    if (runIds.length === 0) {
      return;
    }
    this.fileReportService
      .deleteRuns(this.projectSlug(), runIds)
      .pipe(take(1))
      .subscribe(({ deletedRunIds }) => {
        const deleted = new Set(deletedRunIds);
        const dataSource = this.fileTableDataSourceModelService.dataSource();
        const remaining = dataSource.data.filter(
          (run) => !deleted.has(run.runId)
        );
        dataSource.data = remaining;
        this.fileTableDataSourceService.setData(remaining);
        selection.clear();
      });
  }

  private handleReportDownload(
    projectSlug: string,
    selected: Jsonified<RunSummary>[]
  ) {
    // The spreadsheet covers whole tests, so each test is listed once.
    const eventIds = [...new Set(selected.map((item) => item.eventId))];
    this.fileReportService
      .downloadFileReports(projectSlug, eventIds)
      .pipe(take(1))
      .subscribe();
  }

  toggleAllRows() {
    // Toggle selection for only the rows displayed on the current page
    const ds = this.fileTableDataSourceModelService.dataSource();
    const sel = this.fileTableDataSourceModelService.selection();

    // Derive the working set: prefer filteredData if present, else all data
    // Note: MatTableDataSource exposes filteredData publicly
    const working =
      (ds as unknown as { filteredData?: Jsonified<RunSummary>[] })
        .filteredData ?? ds.data;
    // Apply sorting consistent with the table if available
    const sorted = ds.sort ? ds.sortData(working, ds.sort) : working;

    const pageIndex = ds.paginator?.pageIndex ?? 0;
    const pageSize = ds.paginator?.pageSize ?? sorted.length;
    const start = pageIndex * pageSize;
    const end = Math.min(start + pageSize, sorted.length);
    const pageRows = sorted.slice(start, end);

    // Determine if all rows on the current page are already selected
    const allPageSelected = pageRows.every((r) => sel.isSelected(r));

    // Build next selection set immutably
    let nextSelected: Jsonified<RunSummary>[];
    if (allPageSelected) {
      // Deselect only the current page rows
      const pageSet = new Set(pageRows);
      nextSelected = sel.selected.filter((r) => !pageSet.has(r));
    } else {
      // Select union of existing selection and current page rows
      const set = new Set(sel.selected);
      for (const r of pageRows) {
        set.add(r);
      }
      nextSelected = Array.from(set);
    }

    const newModel = new SelectionModel<Jsonified<RunSummary>>(
      true,
      nextSelected
    );
    this.fileTableDataSourceModelService.selection.set(newModel);
  }

  toggleRow(row: Jsonified<RunSummary>) {
    const prevModel = this.fileTableDataSourceModelService.selection();
    const prevSelected = prevModel.selected;
    const isSelected = prevModel.isSelected(row);
    const newSelected = isSelected
      ? prevSelected.filter((r) => r !== row)
      : [...prevSelected, row];
    const newModel = new SelectionModel<Jsonified<RunSummary>>(
      true,
      newSelected
    );
    this.fileTableDataSourceModelService.selection.set(newModel);
  }

  checkboxLabel(row?: Jsonified<RunSummary>): string {
    if (!row) {
      return `${this.isAllSelected ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} the ${row.eventName} run of ${row.runAt}`;
  }

  /** Return the current data source directly */
  get dataSource(): MatTableDataSource<Jsonified<RunSummary>> {
    return this.fileTableDataSourceModelService.computedDataSource();
  }

  /** Return the current selection model directly */
  get selection(): SelectionModel<Jsonified<RunSummary>> {
    return this.fileTableDataSourceModelService.computedSelection();
  }

  /** Return whether all rows are selected */
  get isAllSelected(): boolean {
    const ds = this.fileTableDataSourceModelService.dataSource();
    const sel = this.fileTableDataSourceModelService.selection();

    const working =
      (ds as unknown as { filteredData?: Jsonified<RunSummary>[] })
        .filteredData ?? ds.data;
    const sorted = ds.sort ? ds.sortData(working, ds.sort) : working;
    const pageIndex = ds.paginator?.pageIndex ?? 0;
    const pageSize = ds.paginator?.pageSize ?? sorted.length;
    const start = pageIndex * pageSize;
    const end = Math.min(start + pageSize, sorted.length);
    const pageRows = sorted.slice(start, end);
    return pageRows.length > 0 && pageRows.every((r) => sel.isSelected(r));
  }
}
