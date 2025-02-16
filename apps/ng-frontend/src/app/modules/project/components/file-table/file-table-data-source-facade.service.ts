import { computed, effect, Injectable, signal } from '@angular/core';
import { FileTableDataSourceService } from '../../../../shared/services/data-source/file-table-data-source.service';
import { FileReportService } from '../../../../shared/services/api/file-report/file-report.service';
import { take } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import {
  FrontFileReport,
  IReportDetails,
  TestEvent,
  TestEventDetailSchema,
  TestImage
} from '@utils';
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

  readonly dataSource = signal<MatTableDataSource<IReportDetails & TestImage>>(
    new MatTableDataSource()
  );

  // Selection model as a signal
  readonly selection = signal(
    new SelectionModel<IReportDetails & TestImage>(true, [])
  );

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
    const fileReports = data['fileReports'] as FrontFileReport[];
    const projectSlug = data['projectSlug'] as string;

    // cross-join the test events with the test event details and test images
    const reports = fileReports.flatMap((report, index) => {
      return report.testEventDetails.map((detail, detailIndex) =>
        this.mapTestEventDetails(
          detail,
          detailIndex,
          report,
          report.testImage[detailIndex]
        )
      );
    });

    console.log('reports: ', reports);

    if (reports.length && paginator && sort) {
      // Sort the data
      const injectReports = reports.sort((a, b) =>
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

  private mapTestEventDetails(
    details: TestEventDetailSchema,
    position: number,
    event: TestEvent,
    image: TestImage
  ): IReportDetails & TestImage {
    return {
      // Test event details
      passed: details.passed,
      requestPassed: details.requestPassed,
      dataLayer: details.dataLayer,
      rawRequest: details.rawRequest,
      reformedDataLayer: details.reformedDataLayer,
      destinationUrl: details.destinationUrl,

      // Test event
      position,
      event: event.eventName,
      eventId: event.eventId,
      eventName: event.eventName,
      testName: event.testName,
      createdAt: details.createdAt, // TODO: fix this
      stopNavigation: event.stopNavigation,
      message: event.message,

      // Test image
      imageName: image.imageName,
      imageSize: image.imageSize,
      imageData: image.imageData
    };
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
    selected: (IReportDetails & TestImage)[]
  ) {
    this.fileReportService
      .downloadFileReports(
        projectSlug,
        selected.map((item) => item.eventId)
      )
      .pipe(take(1))
      .subscribe();
  }

  toggleAllRows() {
    if (this.selection().selected.length === this.dataSource().data.length) {
      this.selection().clear();
      return;
    }
    // Otherwise, select all
    this.selection().select(...this.dataSource().data);
  }

  checkboxLabel(row?: IReportDetails & TestImage): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${
      this.selection().isSelected(row) ? 'deselect' : 'select'
    } row ${(row as any).position + 1}`;
  }
}
