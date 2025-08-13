import { effect, Injectable, signal } from '@angular/core';
import { FileTableDataSourceService } from '../../../../shared/services/data-source/file-table-data-source.service';
import { FileReportService } from '../../../../shared/services/api/file-report/file-report.service';
import { take } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
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
import { FileTableDataSourceModelService } from '../../services/file-table-data-source-model/file-table-data-source-model.service';
import { SelectionModel } from '@angular/cdk/collections';

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
  private readonly projectSlug = signal<string>('');

  constructor(
    private readonly fileTableDataSourceService: FileTableDataSourceService,
    private readonly fileTableDataSourceModelService: FileTableDataSourceModelService,
    private readonly fileReportService: FileReportService,
    private readonly dialog: MatDialog
  ) {
    effect(() => {
      const filterValue = this.fileTableDataSourceService.getFilterSignal();
      const currentDataSource =
        this.fileTableDataSourceModelService.dataSource();
      if (currentDataSource) {
        currentDataSource.filter = filterValue;
      }
    });
    effect(() => {
      const deletedSignal = this.fileTableDataSourceService.getDeletedSignal();
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
    });
    effect(() => {
      const downloadSignal =
        this.fileTableDataSourceService.getDownloadSignal();
      if (downloadSignal) {
        const dialogRef = this.dialog.open(InformationDialogComponent, {
          data: {
            title: 'Download Reports',
            contents: 'Are you sure you want to download the selected reports?',
            action: 'Download',
            actionColor: 'primary',
            consent: false
          }
        });
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.handleReportDownload(
              this.projectSlug(),
              this.fileTableDataSourceModelService.selection().selected
            );
          }
          this.fileTableDataSourceService.setDownloadSignal(false);
        });
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initializeData(paginator: MatPaginator, sort: MatSort, data: any) {
    const fileReports = data['fileReports'] as FrontFileReport[];
    const projectSlug = data['projectSlug'] as string;

    console.log('File Reports: ', fileReports);

    // cross-join the test events with the test event details and test images
    const reports = fileReports.flatMap((report) => {
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
      const injectReports = reports.toSorted((a, b) =>
        a.eventName.localeCompare(b.eventName)
      );
      // Create data source and assign
      const dataSource = new MatTableDataSource(injectReports);
      dataSource.paginator = paginator;
      dataSource.sort = sort;
      this.fileTableDataSourceModelService.dataSource.set(dataSource);
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
      createdAt: details.createdAt,
      stopNavigation: event.stopNavigation,
      message: event.message,

      // Test image
      imageName: image.imageName,
      imageSize: image.imageSize,
      imageData: image.imageData
    };
  }

  private handleReportDeletion() {
    const remainingReports = this.fileTableDataSourceModelService
      .dataSource()
      .data.filter(
        (item) =>
          !this.fileTableDataSourceModelService
            .selection()
            .selected.includes(item)
      );
    this.fileTableDataSourceModelService.dataSource().data = remainingReports;
    this.fileTableDataSourceService.setData(remainingReports);
    this.fileReportService
      .deleteFileReport(
        this.projectSlug(),
        this.fileTableDataSourceModelService
          .selection()
          .selected.map((item) => item.eventId)
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
    // Rebuild selection immutably so the signal notifies subscribers
    const ds = this.fileTableDataSourceModelService.dataSource();
    const current = this.fileTableDataSourceModelService.selection();
    const allSelected = current.selected.length === ds.data.length;
    const newSelected = allSelected ? [] : [...ds.data];
    const newModel = new SelectionModel<IReportDetails & TestImage>(
      true,
      newSelected
    );
    this.fileTableDataSourceModelService.selection.set(newModel);
  }

  toggleRow(row: IReportDetails & TestImage) {
    const prevModel = this.fileTableDataSourceModelService.selection();
    const prevSelected = prevModel.selected;
    const isSelected = prevModel.isSelected(row);
    const newSelected = isSelected
      ? prevSelected.filter((r) => r !== row)
      : [...prevSelected, row];
    const newModel = new SelectionModel<IReportDetails & TestImage>(
      true,
      newSelected
    );
    this.fileTableDataSourceModelService.selection.set(newModel);
  }

  checkboxLabel(row?: IReportDetails & TestImage): string {
    if (!row) {
      return `${this.isAllSelected ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  /** Return the current data source directly */
  get dataSource(): MatTableDataSource<IReportDetails & TestImage> {
    return this.fileTableDataSourceModelService.computedDataSource();
  }

  /** Return the current selection model directly */
  get selection(): SelectionModel<IReportDetails & TestImage> {
    return this.fileTableDataSourceModelService.computedSelection();
  }

  /** Return whether all rows are selected */
  get isAllSelected(): boolean {
    const ds = this.fileTableDataSourceModelService.dataSource();
    const sel = this.fileTableDataSourceModelService.selection();
    return sel.selected.length === ds.data.length;
  }
}
