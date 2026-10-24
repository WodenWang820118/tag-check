import { SelectionModel } from '@angular/cdk/collections';
import { Injectable, signal, computed } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Jsonified, RunSummary } from '@utils';

/**
 * The Reports page's runs and selection, shared by its table and toolbar.
 * Rows are GET /file-reports items as JSON, so dates are strings.
 */
@Injectable({
  providedIn: 'root'
})
export class FileTableDataSourceModelService {
  readonly dataSource = signal<MatTableDataSource<Jsonified<RunSummary>>>(
    new MatTableDataSource()
  );
  readonly computedDataSource = computed(() => this.dataSource());
  readonly selection = signal(
    new SelectionModel<Jsonified<RunSummary>>(true, [])
  );
  readonly computedSelection = computed(() => this.selection());
}
