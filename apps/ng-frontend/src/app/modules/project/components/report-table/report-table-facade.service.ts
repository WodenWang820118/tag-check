import { Injectable, effect, signal, computed } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { IReportDetails } from '@utils';
import { ProjectDataSourceService } from '../../../../shared/services/data-source/project-data-source.service';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { InformationDialogComponent } from '../../../../shared/components/information-dialog/information-dialog.component';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ReportTableDataSourceModelService } from '../../services/report-table-data-source-model/report-table-data-source-model.service';

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
  private hasRecordingMap: Map<string, boolean> = new Map();

  constructor(
    private projectDataSourceService: ProjectDataSourceService,
    private dialog: MatDialog,
    private reportService: ReportService,
    private testRunningFacadeService: TestRunningFacadeService,
    private reportTableDataSourceModelService: ReportTableDataSourceModelService
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
            const newStopNavigation =
              item.stopNavigation === true ? false : true;

            return {
              ...item,
              stopNavigation: newStopNavigation
            };
          });

        // Update the data source with the same logic
        this.reportTableDataSourceModelService.dataSource().data =
          this.reportTableDataSourceModelService
            .dataSource()
            .data.map((item) => {
              if (
                this.reportTableDataSourceModelService
                  .selection()
                  .selected.includes(item)
              ) {
                item.stopNavigation =
                  item.stopNavigation === true ? false : true;
              }
              return item;
            });

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
            const remainingReports = this.reportTableDataSourceModelService
              .dataSource()
              .data.filter(
                (item) =>
                  !this.reportTableDataSourceModelService
                    .selection()
                    .selected.includes(item)
              );
            this.reportTableDataSourceModelService.dataSource().data =
              remainingReports;
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
    if (
      !data['projectReport'] ||
      !data['recordings'] ||
      !data['projectSetting']
    )
      return;
    const reports = data['projectReport'];

    if (reports.length && paginator && sort) {
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
    this.testRunningFacadeService
      .runTest(
        eventId,
        this.projectSlug(),
        this.reportTableDataSourceModelService.dataSource()
      )
      .pipe(take(1))
      .subscribe((updatedData) => {
        if (updatedData) {
          this.reportTableDataSourceModelService.dataSource().data = [
            ...updatedData.data
          ];
        }
      });
  }

  hasRecording(eventId: string): boolean {
    return this.hasRecordingMap.get(eventId) || false;
  }

  /** Toggle selection of all rows immutably to trigger signal updates */
  toggleAllRows(): void {
    const ds = this.reportTableDataSourceModelService.dataSource();
    const current = this.reportTableDataSourceModelService.selection();
    const allSelected = current.selected.length === ds.data.length;
    const newSelected = allSelected ? [] : [...ds.data];
    const newModel = new SelectionModel<IReportDetails>(true, newSelected);
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
      return `${this.reportTableDataSourceModelService.isAllSelected() ? 'deselect' : 'select'} all`;
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

  get isAllSelected() {
    return this.reportTableDataSourceModelService.isAllSelected;
  }
}
