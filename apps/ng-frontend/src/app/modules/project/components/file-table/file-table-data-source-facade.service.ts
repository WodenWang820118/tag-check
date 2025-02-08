import { computed, effect, Injectable, signal } from '@angular/core';
import { FileTableDataSourceService } from '../../../../shared/services/data-source/file-table-data-source.service';
import { FileReportService } from '../../../../shared/services/api/file-report/file-report.service';
import { tap, take } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { FileReport, FrontFileReport } from '@utils';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { InformationDialogComponent } from '../../../../shared/components/information-dialog/information-dialog.component';
import { MatSort } from '@angular/material/sort';

@Injectable({
  providedIn: 'root'
})
export class FileTableDataSourceFacadeService {
  columns = signal([
    'select',
    'eventName',
    'dataLayerState',
    'requestState',
    'createdAt'
  ]);

  readonly dataSource = signal<MatTableDataSource<FrontFileReport>>(
    new MatTableDataSource()
  );

  // Selection model as a signal
  readonly selection = signal(new SelectionModel<FrontFileReport>(true, []));

  // Computed property for "select all" behavior
  readonly isAllSelected = computed(() => {
    const ds = this.dataSource();
    const numSelected = this.selection().selected.length;
    return ds && numSelected === ds.data.length;
  });
  private readonly projectSlug = signal<string>('');

  constructor(
    private fileTableDataSourceService: FileTableDataSourceService,
    private fileReportService: FileReportService,
    private dialog: MatDialog
  ) {
    effect(
      () => {
        const filterValue = this.fileTableDataSourceService.getFilterSignal();
        const currentDataSource = this.dataSource();
        if (currentDataSource) {
          currentDataSource.filter = filterValue;
        }
      },
      {
        allowSignalWrites: true
      }
    );
    effect(
      () => {
        const deletedSignal =
          this.fileTableDataSourceService.getDeletedSignal();
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
              this.handleReportDeletion();
            }
            this.fileTableDataSourceService.setDeletedSignal(false);
          });
        }
      },
      {
        allowSignalWrites: true
      }
    );
    effect(
      () => {
        const downloadSignal =
          this.fileTableDataSourceService.getDownloadSignal();
        if (downloadSignal) {
          const dialogRef = this.dialog.open(InformationDialogComponent, {
            data: {
              title: 'Download Reports',
              contents:
                'Are you sure you want to download the selected reports?',
              action: 'Download',
              actionColor: 'primary',
              consent: false
            }
          });
          dialogRef.afterClosed().subscribe((result) => {
            if (result) {
              this.handleReportDownload(
                this.projectSlug(),
                this.selection().selected
              );
            }
            this.fileTableDataSourceService.setDownloadSignal(false);
          });
        }
      },
      {
        allowSignalWrites: true
      }
    );
  }

  initializeData(paginator: MatPaginator, sort: MatSort, data: any) {
    console.log(data);
    const fileReports = data['fileReports'];
    const projectSlug = data['projectSlug'];

    if (fileReports && paginator && sort) {
      // Sort the data
      const injectReports = (fileReports as FrontFileReport[]).sort((a, b) =>
        a.eventName.localeCompare(b.eventName)
      );
      // Create data source and assign
      const dataSource = new MatTableDataSource(injectReports);
      dataSource.paginator = paginator;
      dataSource.sort = sort;
      this.dataSource.set(dataSource);
      this.projectSlug.set(projectSlug);
    }
  }

  private handleReportDeletion() {
    const remainingReports = this.dataSource().data.filter(
      (item) => !this.selection().selected.includes(item)
    );
    this.dataSource().data = remainingReports;
    this.fileTableDataSourceService.setData(remainingReports);
    this.fileReportService
      .deleteFileReport(
        this.projectSlug(),
        this.selection().selected.map((item) => item.eventId)
      )
      .pipe(take(1))
      .subscribe();
  }

  private handleReportDownload(
    projectSlug: string,
    selected: FrontFileReport[]
  ) {
    this.fileReportService
      .downloadFileReports(
        projectSlug,
        selected.map((item) => item.eventId)
      )
      .pipe(take(1))
      .subscribe();
  }

  preprocessData(data: FileReport[]) {
    return data.map((item, index) => {
      return {
        ...item,
        position: index
      };
    });
  }

  toggleAllRows() {
    if (this.selection().selected.length === this.dataSource().data.length) {
      this.selection().clear();
      return;
    }
    // Otherwise, select all
    this.selection().select(...this.dataSource().data);
  }

  checkboxLabel(row?: FrontFileReport): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${
      this.selection().isSelected(row) ? 'deselect' : 'select'
    } row ${(row as any).position + 1}`;
  }
}
