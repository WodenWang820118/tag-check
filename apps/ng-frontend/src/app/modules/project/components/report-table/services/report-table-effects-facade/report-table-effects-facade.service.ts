import { SelectionModel } from '@angular/cdk/collections';
import { Injectable, effect, inject, untracked } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { finalize, take } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IReportDetails } from '@utils';
import { ProjectDataSourceService } from '../../../../../../shared/services/data-source/project-data-source.service';
import { ReportService } from '../../../../../../shared/services/api/report/report.service';
import { InformationDialogComponent } from '../../../../../../shared/components/information-dialog/information-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ReportTableDataSourceModelService } from '../../../../services/report-table-data-source-model/report-table-data-source-model.service';
import {
  reportFilterPredicate,
  StatusFilter,
  toReportFilter
} from '../../report-filter';

export interface ReportTableEffectsInitOptions {
  getStatus: () => StatusFilter;
  getProjectSlug: () => string;
}

/**
 * The tests table's effects. The toolbar asks for a bookmark save or a
 * delete through ProjectDataSourceService's signals; these effects carry
 * them out, and keep the filters applied to the current data source.
 */
@Injectable({ providedIn: 'root' })
export class ReportTableEffectsFacadeService {
  private initialized = false;
  private getStatus: () => StatusFilter = () => 'all';
  private getProjectSlug: () => string = () => '';

  private readonly projectDataSourceService = inject(ProjectDataSourceService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly reportService = inject(ReportService);
  private readonly reportTableDataSourceModelService = inject(
    ReportTableDataSourceModelService
  );

  //#region Initialize & effects
  /**
   * Starts the effects, reading the status filter and the project from
   * ReportTableFacadeService, which owns them (passed as callbacks because
   * that facade injects this one). Must run in an injection context; only
   * the first call counts, as both services live as long as the app.
   */
  initialize(opts: ReportTableEffectsInitOptions) {
    if (this.initialized) return;
    this.initialized = true;
    this.getStatus = opts.getStatus;
    this.getProjectSlug = opts.getProjectSlug;

    // Effect 1: apply the text and status filter to the current data source.
    // A run or a delete replaces the data source, so the predicate is set
    // again on each one.
    effect(() => {
      const text = this.projectDataSourceService.getFilterSignal();
      const status = this.getStatus();
      const ds = this.reportTableDataSourceModelService.dataSource();
      ds.filterPredicate = reportFilterPredicate;
      ds.filter = toReportFilter(text, status);
    });

    // Effect 2: Save bookmarks before changing the visible state.
    effect(() => {
      if (!this.projectDataSourceService.getPreventNavigationSignal()) return;
      untracked(() => {
        const saveProjectSlug = this.getProjectSlug();
        const testEvents = this.reportTableDataSourceModelService
          .selection()
          .selected.map((item) => ({
            ...item,
            stopNavigation: item.stopNavigation !== true
          }));
        if (testEvents.length === 0) {
          this.projectDataSourceService.setPreventNavigationSignal(false);
          return;
        }
        this.reportService
          .updateTestEvents(saveProjectSlug, testEvents)
          .pipe(
            take(1),
            finalize(() =>
              this.projectDataSourceService.setPreventNavigationSignal(false)
            )
          )
          .subscribe({
            next: () => {
              // The user switched project while saving: these rows are another project's.
              if (this.getProjectSlug() !== saveProjectSlug) {
                this.projectDataSourceService.setPreventNavigationSignal(false);
                return;
              }
              const settings = new Map(
                testEvents.map((item) => [item.eventId, item.stopNavigation])
              );
              const ds = this.reportTableDataSourceModelService.dataSource();
              // Keep selected row identities, filters, sorting and pagination.
              ds.data = ds.data.map((item) => {
                const stopNavigation = settings.get(item.eventId);
                if (stopNavigation !== undefined) {
                  item.stopNavigation = stopNavigation;
                }
                return item;
              });
            },
            error: () => {
              if (this.getProjectSlug() !== saveProjectSlug) {
                this.projectDataSourceService.setPreventNavigationSignal(false);
                return;
              }
              this.snackBar.open(
                'Could not save navigation bookmarks. Please try again.',
                'Dismiss',
                { duration: 5000 }
              );
            }
          });
      });
    });

    // Effect 3: Delete Confirmation effect
    effect(() => {
      const deletedSignal = this.projectDataSourceService.getDeletedSignal();
      if (deletedSignal) {
        const dialogRef = this.dialog.open(InformationDialogComponent, {
          data: {
            title: 'Delete Reports',
            contents: 'Are you sure you want to delete the selected reports?',
            action: 'Delete',
            actionColor: 'warn',
            consent: false
          }
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            const model = this.reportTableDataSourceModelService;
            const selected = model.selection().selected;
            const current = model.dataSource();
            // The rows go at once; the filter effect re-applies the filter
            // to the new data source.
            const remaining = new MatTableDataSource<IReportDetails>(
              current.data.filter((item) => !selected.includes(item))
            );
            remaining.paginator = current.paginator;
            remaining.sort = current.sort;
            model.dataSource.set(remaining);
            // The deleted rows must not stay selected, or the toolbar would
            // still offer to delete, run or bookmark them.
            model.selection.set(new SelectionModel<IReportDetails>(true, []));

            const deleteProjectSlug = this.getProjectSlug();
            this.reportService
              .deleteBatchReports(
                deleteProjectSlug,
                selected.map((item) => item.eventId)
              )
              .pipe(take(1))
              .subscribe({
                error: () => {
                  // Another project's table is showing: its rows came from
                  // the server and never held these tests.
                  if (this.getProjectSlug() === deleteProjectSlug) {
                    this.restoreRows(current.data, selected);
                  }
                  this.snackBar.open(
                    'Could not delete the selected tests. Please try again.',
                    'Dismiss',
                    { duration: 5000 }
                  );
                }
              });
          }
          this.projectDataSourceService.setDeletedSignal(false);
        });
      }
    });
  }
  //#endregion

  /**
   * Puts rows whose delete failed back in the table, in their old order.
   * Rows that stayed keep their latest version, as a run that ended during
   * the delete replaced them.
   */
  private restoreRows(before: IReportDetails[], deleted: IReportDetails[]) {
    const model = this.reportTableDataSourceModelService;
    const latest = model.dataSource();
    const latestById = new Map(latest.data.map((row) => [row.eventId, row]));
    const deletedIds = new Set(deleted.map((row) => row.eventId));
    const beforeIds = new Set(before.map((row) => row.eventId));
    const rows = before.flatMap((row) => {
      if (deletedIds.has(row.eventId)) return [row];
      const kept = latestById.get(row.eventId);
      return kept ? [kept] : [];
    });
    rows.push(...latest.data.filter((row) => !beforeIds.has(row.eventId)));

    const restored = new MatTableDataSource<IReportDetails>(rows);
    restored.paginator = latest.paginator;
    restored.sort = latest.sort;
    model.dataSource.set(restored);
  }
}
