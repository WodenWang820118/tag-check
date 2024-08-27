import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { DatePipe, NgClass } from '@angular/common';
import { MatSort, Sort } from '@angular/material/sort';
import { FileReport } from '@utils';
import { MatInputModule } from '@angular/material/input';
import { FileTableDataSourceFacadeService } from '../../../../shared/services/facade/file-table-data-source-facade.service';
import { MatSortModule } from '@angular/material/sort';

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
  ],
  providers: [FileTableDataSourceFacadeService],
  templateUrl: './file-table.component.html',
  styleUrls: ['./file-table.component.scss'],
})
export class FileTableComponent implements OnDestroy {
  selection = new SelectionModel<FileReport>(true, []);
  dataSource!: MatTableDataSource<FileReport>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  columns: string[] = [
    'select',
    'name',
    'dataLayerState',
    'requestState',
    'lastModified',
  ];
  destroy$ = new Subject<void>();

  constructor(
    private fileTableDataSourceFacadeService: FileTableDataSourceFacadeService
  ) {
    this.fileTableDataSourceFacadeService
      .observeDataSource()
      .pipe(
        takeUntil(this.destroy$),
        tap((data) => {
          if (data) {
            this.dataSource = new MatTableDataSource(data);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          }
        }),
        switchMap(() => {
          return forkJoin({
            deleteResult:
              this.fileTableDataSourceFacadeService.observeTableDelete(
                this.selection,
                this.dataSource
              ),
            downloadResult:
              this.fileTableDataSourceFacadeService.observeDownload(
                this.selection,
                this.dataSource
              ),
          });
        })
      )
      .subscribe();

    this.fileTableDataSourceFacadeService
      .observeTableFilter()
      .pipe(
        takeUntil(this.destroy$),
        tap((filter) => {
          this.dataSource.filter = filter;
        })
      )
      .subscribe();
  }

  sortData(sort: Sort) {
    const data = this.dataSource.data.slice();
    if (!sort.active || sort.direction === '') {
      this.dataSource.data = data;
      return;
    }

    this.dataSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name':
          return this.compare(a.name, b.name, isAsc);
        case 'dataLayerState':
          return this.compare(a.dataLayerState, b.dataLayerState, isAsc);
        case 'requestState':
          return this.compare(a.requestState, b.requestState, isAsc);
        case 'lastModified':
          return this.compare(
            new Date(a.lastModified).getTime(),
            new Date(b.lastModified).getTime(),
            isAsc
          );
        default:
          return 0;
      }
    });
  }

  compare(
    a: number | string | boolean | Date,
    b: number | string | boolean | Date,
    isAsc: boolean
  ) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  selectSingleRow(row: FileReport) {
    this.selection.toggle(row);
    this.selection.select(row);
  }

  getSelectedRows(): FileReport[] {
    return this.selection.selected;
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    if (!this.dataSource) {
      return;
    }

    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: FileReport): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }

    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
