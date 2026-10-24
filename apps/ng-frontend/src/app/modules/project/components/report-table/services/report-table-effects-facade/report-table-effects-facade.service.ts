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
  initialize(opts: ReportTableEffectsInitOptions) {
    if (this.initialized) return; // idempotent
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
            const currentDsB =
              this.reportTableDataSourceModelService.dataSource();
            const remainingReports = currentDsB.data.filter(
              (item: IReportDetails) =>
                !this.reportTableDataSourceModelService
                  .selection()
                  .selected.includes(item)
            );
            const newDsB = new MatTableDataSource<IReportDetails>([
              ...remainingReports
            ]);
            newDsB.paginator = currentDsB.paginator;
            newDsB.sort = currentDsB.sort;
            this.reportTableDataSourceModelService.dataSource.set(newDsB);

            this.reportService
              .deleteBatchReports(
                this.getProjectSlug(),
                this.reportTableDataSourceModelService
                  .selection()
                  .selected.map((item: IReportDetails) => item.eventId)
              )
              .pipe(take(1))
              .subscribe();
          }
          this.projectDataSourceService.setDeletedSignal(false);
        });
      }
    });
  }
  //#endregion
}
