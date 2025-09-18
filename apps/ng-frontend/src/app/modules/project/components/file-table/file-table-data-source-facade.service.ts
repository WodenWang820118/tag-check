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
  columns = signal(['select', 'eventName', 'status', 'completedTime']);
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
    console.log(
      'Mapping TestEventDetail:',
      details,
      'with event:',
      event,
      'and image:',
      image
    );
    return {
      // Test event details
      passed: details.passed,
      requestPassed: details.requestPassed,
      dataLayer: details.dataLayer,
      rawRequest: details.rawRequest,
      destinationUrl: details.destinationUrl,

      // Test event
      position,
      event: event.eventName,
      eventId: event.eventId,
      eventName: event.eventName,
      testName: event.testName,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      stopNavigation: event.stopNavigation,
      message: event.message,

      // Test image
      imageName: image?.imageName || '',
      imageSize: image?.imageSize || 0,
      imageData: image?.imageData || ''
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
    // Toggle selection for only the rows displayed on the current page
    const ds = this.fileTableDataSourceModelService.dataSource();
    const sel = this.fileTableDataSourceModelService.selection();

    // Derive the working set: prefer filteredData if present, else all data
    // Note: MatTableDataSource exposes filteredData publicly
    const working =
      (ds as unknown as { filteredData?: (IReportDetails & TestImage)[] })
        .filteredData ?? ds.data;
    // Apply sorting consistent with the table if available
    const sorted = ds.sort ? ds.sortData(working, ds.sort) : working;

    const pageIndex = ds.paginator?.pageIndex ?? 0;
    const pageSize = ds.paginator?.pageSize ?? sorted.length;
    const start = pageIndex * pageSize;
    const end = Math.min(start + pageSize, sorted.length);
    const pageRows = sorted.slice(start, end);

    // Determine if all rows on the current page are already selected
    const allPageSelected = pageRows.every((r) => sel.isSelected(r));

    // Build next selection set immutably
    let nextSelected: (IReportDetails & TestImage)[];
    if (allPageSelected) {
      // Deselect only the current page rows
      const pageSet = new Set(pageRows);
      nextSelected = sel.selected.filter((r) => !pageSet.has(r));
    } else {
      // Select union of existing selection and current page rows
      const set = new Set(sel.selected);
      pageRows.forEach((r) => set.add(r));
      nextSelected = Array.from(set);
    }

    const newModel = new SelectionModel<IReportDetails & TestImage>(
      true,
      nextSelected
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

    const working =
      (ds as unknown as { filteredData?: (IReportDetails & TestImage)[] })
        .filteredData ?? ds.data;
    const sorted = ds.sort ? ds.sortData(working, ds.sort) : working;
    const pageIndex = ds.paginator?.pageIndex ?? 0;
    const pageSize = ds.paginator?.pageSize ?? sorted.length;
    const start = pageIndex * pageSize;
    const end = Math.min(start + pageSize, sorted.length);
    const pageRows = sorted.slice(start, end);
    return pageRows.length > 0 && pageRows.every((r) => sel.isSelected(r));
  }
}
