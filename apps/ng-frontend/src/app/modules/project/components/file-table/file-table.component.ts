import { Component, viewChild, OnInit, DestroyRef } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { tap } from 'rxjs';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DatePipe, NgClass, CommonModule } from '@angular/common';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { IReportDetails, TestImage } from '@utils';
import { MatInputModule } from '@angular/material/input';
import { FileTableDataSourceFacadeService } from './file-table-data-source-facade.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableSortService } from '../../../../shared/services/utils/table-sort.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatSortModule,
    MatChipsModule,
    MatTooltipModule,
    CommonModule
  ],
  templateUrl: './file-table.component.html',
  styleUrls: ['./file-table.component.css']
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
          console.log('Route data for file table:', data);
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
      [
        { name: 'eventName', type: 'string' },
        { name: 'testName', type: 'string' },
        {
          name: 'status',
          type: 'number',
          accessor: (row: IReportDetails & TestImage) => {
            const u = row?.updatedAt ? new Date(row.updatedAt).getTime() : 0;
            const c = row?.createdAt ? new Date(row.createdAt).getTime() : 0;
            const run = u > c;
            const dl = row?.passed === true;
            const req = row?.requestPassed === true;
            if (!run) return 0; // Not run
            if (dl && req) return 3; // Passed
            if (dl || req) return 2; // Partial
            return 1; // Failed
          }
        },
        {
          name: 'completedTime',
          type: 'date',
          accessor: (row: IReportDetails & TestImage) => {
            const u = row?.updatedAt ? new Date(row.updatedAt).getTime() : 0;
            const c = row?.createdAt ? new Date(row.createdAt).getTime() : 0;
            return u > c ? row?.updatedAt : 0;
          }
        }
      ]
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
