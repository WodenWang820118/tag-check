import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { FileTableDataSourceService } from '../../../../shared/services/data-source/file-table-data-source.service';
import { FileReportService } from '../../../../shared/services/api/file-report/file-report.service';
import { firstValueFrom } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { Jsonified, RunSummary } from '@utils';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { InformationDialogComponent } from '../../../../shared/components/information-dialog/information-dialog.component';
import { MatSort } from '@angular/material/sort';
import { FileTableDataSourceModelService } from '../../services/file-table-data-source-model/file-table-data-source-model.service';
import { SelectionModel } from '@angular/cdk/collections';
import { runFilterPredicate, toRunFilter } from './run-filter';
import {
  getCurrentPageRows,
  togglePageSelection,
  toggleRowSelection
} from '../../../../shared/services/utils/table-selection';

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
      if (this.fileTableDataSourceService.getDeletedSignal()) {
        untracked(() => void this.confirmRunDeletion());
      }
    });
    effect(() => {
      if (this.fileTableDataSourceService.getDownloadSignal()) {
        untracked(() => void this.confirmReportDownload());
      }
    });
  }

  /** Asks before deleting the selected runs; the request flag resets on close. */
  private async confirmRunDeletion(): Promise<void> {
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
    const result = await firstValueFrom(dialogRef.afterClosed());
    this.fileTableDataSourceService.setDeletedSignal(false);
    if (result) {
      await this.handleReportDeletion();
    }
  }

  /** Asks before downloading the selected reports; the flag resets on close. */
  private async confirmReportDownload(): Promise<void> {
    const dialogRef = this.dialog.open(InformationDialogComponent, {
      data: {
        title: 'Download Reports',
        contents: 'Are you sure you want to download the selected reports?',
        action: 'Download',
        actionColor: 'primary',
        consent: false
      }
    });
    const result = await firstValueFrom(dialogRef.afterClosed());
    this.fileTableDataSourceService.setDownloadSignal(false);
    if (result) {
      await this.handleReportDownload(
        this.projectSlug(),
        this.fileTableDataSourceModelService.selection().selected
      );
    }
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
  private async handleReportDeletion(): Promise<void> {
    const selection = this.fileTableDataSourceModelService.selection();
    const runIds = selection.selected.map((run) => run.runId);
    if (runIds.length === 0) {
      return;
    }
    try {
      const { deletedRunIds } = await firstValueFrom(
        this.fileReportService.deleteRuns(this.projectSlug(), runIds)
      );
      const deleted = new Set(deletedRunIds);
      const dataSource = this.fileTableDataSourceModelService.dataSource();
      const remaining = dataSource.data.filter(
        (run) => !deleted.has(run.runId)
      );
      dataSource.data = remaining;
      this.fileTableDataSourceService.setData(remaining);
      selection.clear();
    } catch {
      // error handled in service
    }
  }

  private async handleReportDownload(
    projectSlug: string,
    selected: Jsonified<RunSummary>[]
  ): Promise<void> {
    // The spreadsheet covers whole tests, so each test is listed once.
    const eventIds = [...new Set(selected.map((item) => item.eventId))];
    try {
      await firstValueFrom(
        this.fileReportService.downloadFileReports(projectSlug, eventIds)
      );
    } catch {
      // error handled in service
    }
  }

  toggleAllRows() {
    const ds = this.fileTableDataSourceModelService.dataSource();
    const sel = this.fileTableDataSourceModelService.selection();
    const pageRows = getCurrentPageRows(ds);
    const nextSelected = togglePageSelection(sel.selected, pageRows);
    const newModel = new SelectionModel<Jsonified<RunSummary>>(
      true,
      nextSelected
    );
    this.fileTableDataSourceModelService.selection.set(newModel);
  }

  toggleRow(row: Jsonified<RunSummary>) {
    const prevModel = this.fileTableDataSourceModelService.selection();
    const newSelected = toggleRowSelection(prevModel.selected, row);
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
    const pageRows = getCurrentPageRows(ds);
    return pageRows.length > 0 && pageRows.every((r) => sel.isSelected(r));
  }
}
