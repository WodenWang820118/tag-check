import { SelectionModel } from '@angular/cdk/collections';
import { Injectable, signal, computed } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IReportDetails, ReportDetailResponse } from '@utils';

/**
 * The tests table's rows and selection, shared by the table, its toolbar,
 * the run facade and the batch run.
 *
 * Both are replaced, not mutated, when they change: a MatTableDataSource or
 * SelectionModel changed in place does not notify the signal, so a new
 * instance is what makes the table and the toolbar update.
 */
@Injectable({
  providedIn: 'root'
})
export class ReportTableDataSourceModelService {
  readonly dataSource = signal<MatTableDataSource<IReportDetails>>(
    new MatTableDataSource()
  );
  readonly computedDataSource = computed(() => this.dataSource());
  readonly selection = signal(new SelectionModel<IReportDetails>(true, []));
  readonly computedSelection = computed(() => this.selection());

  /**
   * Writes a run's result into the test's row: `result` is the run
   * endpoint's or GET /reports/:projectSlug/:eventId's JSON. The table is
   * read when the run ends, not when it starts: while a run lasts, the user
   * may leave the tests page and come back, which builds a new data source
   * bound to a new paginator and sort.
   */
  applyRunResult(eventId: string, result: ReportDetailResponse): void {
    const current = this.dataSource();
    // The API sends dates as strings; a missing one means the run just ended.
    const updatedAt = result.testEvent?.updatedAt
      ? new Date(result.testEvent.updatedAt)
      : new Date();

    const nextData = current.data.map((event) =>
      event.eventId === eventId
        ? {
            ...event,
            passed: result.testEventDetails?.passed ?? false,
            requestPassed: result.testEventDetails?.requestPassed ?? false,
            requestChecked: result.testEventDetails?.requestChecked ?? true,
            message: result.testEvent?.message ?? event.message,
            updatedAt,
            lastRunAt: result.testEvent?.lastRunAt ?? updatedAt
          }
        : event
    );

    // A new data source instance makes the signal, and the table, update.
    const next = new MatTableDataSource(nextData);
    next.paginator = current.paginator;
    next.sort = current.sort;
    next.filterPredicate = current.filterPredicate;
    next.filter = current.filter;
    this.dataSource.set(next);
  }
}
