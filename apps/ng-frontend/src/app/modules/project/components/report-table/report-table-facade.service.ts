import { Injectable, effect, signal, computed } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { take, tap, switchMap, map } from 'rxjs';
import { IReportDetails } from '@utils';
import { ProjectDataSourceService } from '../../../../shared/services/data-source/project-data-source.service';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { InformationDialogComponent } from '../../../../shared/components/information-dialog/information-dialog.component';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ReportTableDataSourceModelService } from '../../services/report-table-data-source-model/report-table-data-source-model.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ReportTableFacadeService {
  readonly columns = signal([
    'testName',
    'eventName',
    'passed',
    'requestPassed',
    'completedTime'
  ]);

  readonly columnsWithExpand = computed(() => [
    'select',
    ...this.columns(),
    'actions'
  ]);

  readonly expandedElement = signal<Report | null>(null);
  private readonly projectSlug = signal<string>('');
  private readonly hasRecordingMap: Map<string, boolean> = new Map();

  constructor(
    private readonly projectDataSourceService: ProjectDataSourceService,
    private readonly dialog: MatDialog,
    private readonly reportService: ReportService,
    private readonly testRunningFacadeService: TestRunningFacadeService,
    private readonly reportTableDataSourceModelService: ReportTableDataSourceModelService,
    private readonly snackBar: MatSnackBar
  ) {
    effect(() => {
      const filterValue = this.projectDataSourceService.getFilterSignal();
      const currentDataSource =
        this.reportTableDataSourceModelService.dataSource();
      if (currentDataSource) {
        currentDataSource.filter = filterValue;
      }
    });

    // 2b. Update Settings effect
    effect(() => {
      const preventSignal =
        this.projectDataSourceService.getPreventNavigationSignal();
      if (preventSignal) {
        const testEvents = this.reportTableDataSourceModelService
          .selection()
          .selected.map((item) => {
            // Handle the toggle logic properly
            const newStopNavigation = item.stopNavigation !== true;

            return {
              ...item,
              stopNavigation: newStopNavigation
            };
          });

        // Update the data source with the same logic
        const currentDsA = this.reportTableDataSourceModelService.dataSource();
        const nextDataA = currentDsA.data.map((item) => {
          if (
            this.reportTableDataSourceModelService
              .selection()
              .selected.includes(item)
          ) {
            item.stopNavigation = item.stopNavigation !== true;
          }
          return item;
        });
        const newDsA = new MatTableDataSource<IReportDetails>([...nextDataA]);
        newDsA.paginator = currentDsA.paginator;
        newDsA.sort = currentDsA.sort;
        this.reportTableDataSourceModelService.dataSource.set(newDsA);

        this.reportService
          .updateTestEvents(this.projectSlug(), testEvents)
          .pipe(take(1))
          .subscribe();

        this.projectDataSourceService.setPreventNavigationSignal(false);
      }
    });

    // 2c. Delete Confirmation effect
    effect(() => {
      const deletedSignal = this.projectDataSourceService.getDeletedSignal();
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
            const currentDsB =
              this.reportTableDataSourceModelService.dataSource();
            const remainingReports = currentDsB.data.filter(
              (item) =>
                !this.reportTableDataSourceModelService
                  .selection()
                  .selected.includes(item)
            );
            const newDsB = new MatTableDataSource<IReportDetails>([
              ...remainingReports
            ]);
            newDsB.paginator = currentDsB.paginator;
            newDsB.sort = currentDsB.sort;
            this.reportTableDataSourceModelService.dataSource.set(newDsB);
            this.projectDataSourceService.setData(remainingReports);

            this.reportService
              .deleteBatchReports(
                this.projectSlug(),
                this.reportTableDataSourceModelService
                  .selection()
                  .selected.map((item) => item.eventId)
              )
              .pipe(take(1))
              .subscribe();
          }
          this.projectDataSourceService.setDeletedSignal(false);
        });
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initializeData(paginator: MatPaginator, sort: MatSort, data: any) {
    const reports = data['projectReport'] || [];

    if (paginator && sort) {
      // Sort the data
      const injectReports = (reports as IReportDetails[]).sort((a, b) =>
        a.eventName.localeCompare(b.eventName)
      );
      // Create data source and assign
      const dataSource = new MatTableDataSource(injectReports);
      dataSource.paginator = paginator;
      dataSource.sort = sort;
      this.reportTableDataSourceModelService.dataSource.set(dataSource);
      this.projectSlug.set(data['projectSlug']);
    }
  }

  runTest(eventId: string) {
    const projectSlug = this.projectSlug();
    return this.testRunningFacadeService.runTest(
      eventId,
      projectSlug,
      this.reportTableDataSourceModelService.dataSource()
    );
  }

  hasRecording(eventId: string): boolean {
    return this.hasRecordingMap.get(eventId) || false;
  }

  /** Toggle selection of all rows immutably to trigger signal updates */
  toggleAllRows(): void {
    const ds = this.reportTableDataSourceModelService.dataSource();
    const sel = this.reportTableDataSourceModelService.selection();

    // Determine working dataset: filtered first, otherwise full data
    const working =
      (ds as unknown as { filteredData?: IReportDetails[] }).filteredData ??
      ds.data;
    // Align order with displayed sort
    const sorted = ds.sort ? ds.sortData(working, ds.sort) : working;

    // Compute current page slice
    const pageIndex = ds.paginator?.pageIndex ?? 0;
    const pageSize = ds.paginator?.pageSize ?? sorted.length;
    const start = pageIndex * pageSize;
    const end = Math.min(start + pageSize, sorted.length);
    const pageRows = sorted.slice(start, end);

    const allPageSelected = pageRows.every((r) => sel.isSelected(r));

    let nextSelected: IReportDetails[];
    if (allPageSelected) {
      const pageSet = new Set(pageRows);
      nextSelected = sel.selected.filter((r) => !pageSet.has(r));
    } else {
      const set = new Set(sel.selected);
      pageRows.forEach((r) => set.add(r));
      nextSelected = Array.from(set);
    }

    const newModel = new SelectionModel<IReportDetails>(true, nextSelected);
    this.reportTableDataSourceModelService.selection.set(newModel);
  }

  /** Toggle selection of a single row immutably */
  toggleRow(row: IReportDetails) {
    const prevModel = this.reportTableDataSourceModelService.selection();
    const prevSelected = prevModel.selected;
    const isSelected = prevModel.isSelected(row);
    const newSelected = isSelected
      ? prevSelected.filter((r) => r !== row)
      : [...prevSelected, row];
    const newModel = new SelectionModel<IReportDetails>(true, newSelected);
    this.reportTableDataSourceModelService.selection.set(newModel);
  }

  checkboxLabel(row?: IReportDetails): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${
      this.reportTableDataSourceModelService.selection().isSelected(row)
        ? 'deselect'
        : 'select'
    } row ${row.position + 1}`;
  }

  get dataSource() {
    return this.reportTableDataSourceModelService.computedDataSource;
  }

  get selectionSignal() {
    return this.reportTableDataSourceModelService.selection;
  }

  get selection() {
    return this.reportTableDataSourceModelService.computedSelection;
  }

  // Whether all rows on the current page are selected
  isAllSelected(): boolean {
    const ds = this.reportTableDataSourceModelService.dataSource();
    const sel = this.reportTableDataSourceModelService.selection();

    const working =
      (ds as unknown as { filteredData?: IReportDetails[] }).filteredData ??
      ds.data;
    const sorted = ds.sort ? ds.sortData(working, ds.sort) : working;
    const pageIndex = ds.paginator?.pageIndex ?? 0;
    const pageSize = ds.paginator?.pageSize ?? sorted.length;
    const start = pageIndex * pageSize;
    const end = Math.min(start + pageSize, sorted.length);
    const pageRows = sorted.slice(start, end);
    return pageRows.length > 0 && pageRows.every((r) => sel.isSelected(r));
  }
}
