import { SelectionModel } from '@angular/cdk/collections';
import { Injectable, signal, computed } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IReportDetails } from '@utils';

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
}
