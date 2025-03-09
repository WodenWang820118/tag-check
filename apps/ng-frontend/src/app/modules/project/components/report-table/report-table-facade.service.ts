import { Injectable, effect, signal, computed } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { IReportDetails } from '@utils';
import { ProjectDataSourceService } from '../../../../shared/services/data-source/project-data-source.service';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { InformationDialogComponent } from '../../../../shared/components/information-dialog/information-dialog.component';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

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

  // Our table data is a signal of MatTableDataSource
  readonly dataSource = signal<MatTableDataSource<IReportDetails>>(
    new MatTableDataSource()
  );

  // Selection model as a signal
  readonly selection = signal(new SelectionModel<IReportDetails>(true, []));
  // readonly preventNavigationEvents = signal<string[]>([]);
  private readonly projectSlug = signal<string>('');

  // Computed property for "select all" behavior
  readonly isAllSelected = computed(() => {
    const ds = this.dataSource();
    const numSelected = this.selection().selected.length;
    return ds && numSelected === ds.data.length;
  });

  private hasRecordingMap: Map<string, boolean> = new Map();

  constructor(
    private projectDataSourceService: ProjectDataSourceService,
    private dialog: MatDialog,
    private reportService: ReportService,
    private testRunningFacadeService: TestRunningFacadeService
  ) {
    effect(() => {
      const filterValue = this.projectDataSourceService.getFilterSignal();
      const currentDataSource = this.dataSource();
      if (currentDataSource) {
        currentDataSource.filter = filterValue;
      }
    });

    // 2b. Update Settings effect
    effect(() => {
      const preventSignal =
        this.projectDataSourceService.getPreventNavigationSignal();
      if (preventSignal) {
        const testEvents = this.selection().selected.map((item) => {
          // Handle the toggle logic properly
          const newStopNavigation = item.stopNavigation === true ? false : true;

          return {
            ...item,
            stopNavigation: newStopNavigation
          };
        });

        // Update the data source with the same logic
        this.dataSource().data = this.dataSource().data.map((item) => {
          if (this.selection().selected.includes(item)) {
            item.stopNavigation = item.stopNavigation === true ? false : true;
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
            const remainingReports = this.dataSource().data.filter(
              (item) => !this.selection().selected.includes(item)
            );
            this.dataSource().data = remainingReports;
            this.projectDataSourceService.setData(remainingReports);

            this.reportService
              .deleteBatchReports(
                this.projectSlug(),
                this.selection().selected.map((item) => item.eventId)
              )
              .pipe(take(1))
              .subscribe();
          }
          this.projectDataSourceService.setDeletedSignal(false);
        });
      }
    });
  }

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
      this.dataSource.set(dataSource);
      this.projectSlug.set(data['projectSlug']);
    }
  }

  runTest(eventId: string) {
    this.testRunningFacadeService
      .runTest(eventId, this.projectSlug(), this.dataSource())
      .pipe(take(1))
      .subscribe((updatedData) => {
        if (updatedData) {
          this.dataSource().data = [...updatedData.data];
        }
      });
  }

  hasRecording(eventId: string): boolean {
    return this.hasRecordingMap.get(eventId) || false;
  }

  toggleAllRows() {
    if (this.selection().selected.length === this.dataSource().data.length) {
      this.selection().clear();
      return;
    }
    // Otherwise, select all
    this.selection().select(...this.dataSource().data);
  }

  checkboxLabel(row?: IReportDetails): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${
      this.selection().isSelected(row) ? 'deselect' : 'select'
    } row ${(row as any).position + 1}`;
  }
}
