import { Component, viewChild, OnInit, DestroyRef } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { tap } from 'rxjs';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DatePipe, NgClass } from '@angular/common';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { IReportDetails, TestImage } from '@utils';
import { MatInputModule } from '@angular/material/input';
import { FileTableDataSourceFacadeService } from './file-table-data-source-facade.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableSortService } from '../../../../shared/services/utils/table-sort.service';

@Component({
  selector: 'app-file-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatCheckboxModule,
    DatePipe,
    MatInputModule,
    NgClass,
    MatSortModule
  ],
  templateUrl: './file-table.component.html',
  styleUrls: ['./file-table.component.scss']
})
export class FileTableComponent implements OnInit {
  paginator = viewChild.required<MatPaginator>(MatPaginator);
  sort = viewChild.required<MatSort>(MatSort);

  constructor(
    private readonly facade: FileTableDataSourceFacadeService,
    private readonly route: ActivatedRoute,
    private readonly destroyRef: DestroyRef,
    private readonly tableSortService: TableSortService
  ) {}

  ngOnInit() {
    const paginator = this.paginator();
    const sort = this.sort();
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .pipe(
        tap((data) => {
          if (paginator && sort)
            this.facade.initializeData(paginator, sort, data);
        })
      )
      .subscribe();
  }

  sortData(sort: Sort) {
    this.dataSource.data = this.tableSortService.sortData(
      sort,
      this.dataSource.data,
      this.columns.map((col) => ({ name: col, type: 'string' }))
    );
  }

  // The following getters make it easier to use signals in the template:
  get columns() {
    return this.facade.columns();
  }

  get dataSource() {
    return this.facade.dataSource;
  }

  get selection() {
    return this.facade.selection;
  }

  get isAllSelected() {
    return this.facade.isAllSelected;
  }

  toggleAllRows() {
    this.facade.toggleAllRows();
  }

  /** Toggle selection of a single row via facade */
  toggleSelection(row: IReportDetails & TestImage) {
    this.facade.toggleRow(row);
  }

  checkboxLabel(row?: IReportDetails & TestImage) {
    return this.facade.checkboxLabel(row);
  }
}
