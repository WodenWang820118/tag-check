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

type Status = 'all' | 'notRun' | 'failed' | 'partial' | 'passed';

export interface ReportTableEffectsInitOptions {
  getStatus: () => Status;
  getProjectSlug: () => string;
}

@Injectable({ providedIn: 'root' })
export class ReportTableEffectsFacadeService {
  private initialized = false;
  private getStatus!: () => Status;
  private getProjectSlug!: () => string;

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

    // Effect 1: Combine text filter and status filter into one dataSource.filter string
    effect(() => {
      const text = this.projectDataSourceService.getFilterSignal();
      const status = this.getStatus();
      const ds = this.reportTableDataSourceModelService.dataSource();
      if (ds) {
        // Ensure custom filter predicate is set once
        ds.filterPredicate = (data: unknown, filterStr: string) => {
          let parsed: { text?: string; status?: string } = {};
          try {
            parsed = JSON.parse(filterStr || '{}');
          } catch {
            // Fallback: treat entire string as text filter
            parsed = { text: filterStr || '' };
          }
          const t = (parsed.text || '').toLowerCase();
          const s = (parsed.status || 'all') as Status;

          // Text match against key fields
          const haystack =
            `${(data as IReportDetails).testName ?? ''} ${(data as IReportDetails).eventName ?? ''}`.toLowerCase();
          const textMatch = !t || haystack.includes(t);

          // Status match
          const rd = data as IReportDetails;
          const run = (rd?.updatedAt ?? 0) > (rd?.createdAt ?? 0);
          const dl = !!rd?.passed;
          const req = !!rd?.requestPassed;
          let statusKey: 'notRun' | 'failed' | 'partial' | 'passed';
          if (!run) statusKey = 'notRun';
          else if (dl && req) statusKey = 'passed';
          else if (dl || req) statusKey = 'partial';
          else statusKey = 'failed';

          const statusMatch = s === 'all' || s === statusKey;
          return textMatch && statusMatch;
        };

        ds.filter = JSON.stringify({ text, status });
      }
    });

    // Effect 2: Save bookmarks before changing the visible state.
    effect(() => {
      if (!this.projectDataSourceService.getPreventNavigationSignal()) return;
      untracked(() => {
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
          .updateTestEvents(this.getProjectSlug(), testEvents)
          .pipe(
            take(1),
            finalize(() =>
              this.projectDataSourceService.setPreventNavigationSignal(false)
            )
          )
          .subscribe({
            next: () => {
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
