import { SelectionModel } from '@angular/cdk/collections';
import { Injectable, signal, computed } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IReportDetails } from '@utils';

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

  isAllSelected = computed(() => {
    const ds = this.computedDataSource();
    const numSelected = this.computedSelection().selected.length;
    return ds && numSelected === ds.data.length;
  });
}
