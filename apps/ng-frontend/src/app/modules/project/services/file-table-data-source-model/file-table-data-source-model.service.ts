import { SelectionModel } from '@angular/cdk/collections';
import { Injectable, signal, computed } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { IReportDetails, TestImage } from '@utils';
@Injectable({
  providedIn: 'root'
})
export class FileTableDataSourceModelService {
  readonly dataSource = signal<MatTableDataSource<IReportDetails & TestImage>>(
    new MatTableDataSource()
  );

  readonly computedDataSource = computed(() => {
    return this.dataSource();
  });

  readonly selection = signal(
    new SelectionModel<IReportDetails & TestImage>(true, [])
  );

  readonly computedSelection = computed(() => {
    return this.selection();
  });

  readonly isAllSelected = computed(() => {
    const ds = this.computedDataSource();
    const numSelected = this.computedSelection().selected.length;
    console.log('data source:', ds.data);
    console.log('selected:', this.computedSelection().selected);
    console.log('is all selected:', numSelected === ds.data.length);
    return ds && numSelected === ds.data.length;
  });
}
