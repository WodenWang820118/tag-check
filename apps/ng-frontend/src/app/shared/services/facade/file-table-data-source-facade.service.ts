import { Injectable } from '@angular/core';
import { FileTableDataSourceService } from '../file-table-data-source/file-table-data-source.service';
import { ActivatedRoute } from '@angular/router';
import { FileReportService } from '../api/file-report/file-report.service';
import { map, catchError, of, switchMap, tap, combineLatest, take } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { FileReport } from '@utils';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { InformationDialogComponent } from '../../components/information-dialog/information-dialog.component';

@Injectable()
export class FileTableDataSourceFacadeService {
  constructor(
    private route: ActivatedRoute,
    private fileTableDataSourceService: FileTableDataSourceService,
    private fileReportService: FileReportService,
    private dialog: MatDialog
  ) {}

  initDataSource() {
    if (!this.route.parent) {
      return of(null);
    }

    return this.route.parent.params.pipe(
      switchMap((params) => {
        const projectSlug = params['projectSlug'];
        return this.fileReportService.getFileReports(projectSlug).pipe(
          tap((data) => {
            if (data) {
              this.fileTableDataSourceService.setData(
                this.preprocessData(data)
              );
            }
          }),
          catchError((error) => {
            console.error(error);
            return of(null);
          })
        );
      })
    );
  }

  observeDataSource() {
    return this.initDataSource().pipe(
      switchMap(() => {
        return this.fileTableDataSourceService.getData();
      })
    );
  }

  observeTableFilter() {
    return this.fileTableDataSourceService.getFilterStream().pipe(
      map((filter) => {
        return filter;
      }),
      catchError((error) => {
        console.error(error);
        return of('');
      })
    );
  }

  observeTableDelete(
    selection: SelectionModel<FileReport>,
    dataSource: MatTableDataSource<FileReport, MatPaginator>
  ) {
    console.log('Triggered Deletion');
    if (!this.route.parent || !dataSource) {
      return of(null);
    }

    return combineLatest([
      this.route.parent.params,
      this.fileTableDataSourceService.getDeletedStream(),
      selection.changed
    ]).pipe(
      switchMap(([params, deleted, selectionChanges]) => {
        if (selectionChanges.added.length === 0) {
          return of({ params, dialogResult: false });
        }
        if (deleted === false) {
          return of({ params, dialogResult: false });
        } else {
          const dialogRef = this.dialog.open(InformationDialogComponent, {
            data: {
              title: 'Delete Reports',
              contents: 'Are you sure you want to delete the selected reports?',
              action: 'Delete',
              actionColor: 'warn',
              consent: false
            },
            ariaLabel: 'Error Dialog',
            role: 'dialog',
            hasBackdrop: true,
            disableClose: true
          });
          return dialogRef.afterClosed().pipe(
            take(1),
            map((result) => {
              this.fileTableDataSourceService.setDeletedStream(false);
              return { params, dialogResult: result };
            })
          );
        }
      }),
      switchMap(({ params, dialogResult }) => {
        const projectSlug = params['projectSlug'];
        if (dialogResult === true) {
          console.log('delete selected in the report table component');
          this.fileTableDataSourceService.setDeletedStream(false);
          const remainingReports = dataSource.data.filter(
            (item) => !selection.selected.includes(item)
          );
          dataSource.data = remainingReports;
          this.fileTableDataSourceService.setData(remainingReports);

          return this.fileReportService
            .deleteFileReports(projectSlug, selection.selected)
            .pipe(
              tap((data) => {
                if (data) {
                  selection.clear();
                  this.fileTableDataSourceService.setData(dataSource.data);
                }
              }),
              catchError((error) => {
                console.error(error);
                return of(null);
              })
            );
        }
        return of(null);
      })
    );
  }

  observeDownload(
    selection: SelectionModel<FileReport>,
    dataSource: MatTableDataSource<FileReport, MatPaginator>
  ) {
    if (!this.route.parent || !dataSource) {
      return of(null);
    }

    return combineLatest([
      this.route.parent.params,
      this.fileTableDataSourceService.getDownloadStream(),
      selection.changed
    ]).pipe(
      switchMap(([params, download, selectionChanges]) => {
        if (selectionChanges.added.length === 0)
          return of({ params, dialogResult: false });
        if (download === false) {
          return of({ params, dialogResult: false });
        } else {
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
          this.fileTableDataSourceService.setDownloadStream(false);
          return dialogRef.afterClosed().pipe(
            take(1),
            map((result) => {
              return { params, dialogResult: result };
            })
          );
        }
      }),
      switchMap(({ params, dialogResult }) => {
        if (dialogResult === true) {
          console.log('download selected in the report table component');
          this.fileTableDataSourceService.setDownloadStream(false);
          return this.fileReportService
            .downloadFileReports(selection.selected)
            .pipe(
              tap((blob) => {
                if (!blob) {
                  return;
                }
                const fileName = 'report.zip'; // You can generate a dynamic name if needed
                selection.clear();
                this.saveFile(blob, fileName);
              }),
              catchError((error) => {
                console.error(error);
                return of(null);
              })
            );
        }
        return of(null);
      })
    );
  }

  private saveFile(blob: Blob, fileName: string) {
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }

  preprocessData(data: FileReport[]) {
    return data.map((item, index) => {
      const segments = item.name.split(' ');
      const eventName = segments[0];
      const dataLayerState = segments[1] === 'true' ? true : false;
      const requestState = segments[2] === 'true' ? true : false;
      return {
        position: index,
        name: eventName,
        path: item.path,
        dataLayerState: dataLayerState,
        requestState: requestState,
        lastModified: item.lastModified
      };
    });
  }
}
