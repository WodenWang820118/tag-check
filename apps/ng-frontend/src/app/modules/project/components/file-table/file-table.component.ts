import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { DatePipe } from '@angular/common';
import { MatSort } from '@angular/material/sort';
import { FileReport } from '@utils';
import { MatInputModule } from '@angular/material/input';
import { FileTableDataSourceFacadeService } from '../../../../shared/services/facade/file-table-data-source-facade.service';

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
  ],
  providers: [FileTableDataSourceFacadeService],
  templateUrl: './file-table.component.html',
  styles: `

  `,
})
export class FileTableComponent implements OnDestroy {
  selection = new SelectionModel<FileReport>(true, []);
  dataSource!: MatTableDataSource<FileReport>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  columns: string[] = ['select', 'name', 'lastModified'];
  destroy$ = new Subject<void>();

  constructor(
    private fileTableDataSourceFacadeService: FileTableDataSourceFacadeService
  ) {
    this.fileTableDataSourceFacadeService
      .initDataSource()
      .pipe(
        takeUntil(this.destroy$),
        map((data) => {
          if (data) {
            this.dataSource = new MatTableDataSource(data);
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
            return data;
          }
          return [];
        }),
        switchMap((data) => {
          if (!data) {
            return of(null);
          }
          // after the data is loaded, we can observe the delete and download actions
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
