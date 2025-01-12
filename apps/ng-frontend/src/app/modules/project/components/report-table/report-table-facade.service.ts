import { Injectable, effect, signal, computed } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs';
import { IReportDetails } from '@utils';
import { ProjectDataSourceService } from 'apps/ng-frontend/src/app/shared/services/project-data-source/project-data-source.service';
import { SettingsService } from 'apps/ng-frontend/src/app/shared/services/api/settings/settings.service';
import { ReportService } from 'apps/ng-frontend/src/app/shared/services/api/report/report.service';
import { InformationDialogComponent } from 'apps/ng-frontend/src/app/shared/components/information-dialog/information-dialog.component';
import { ProjectFacadeService } from '../../../../shared/services/facade/project-facade.service';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Injectable({ providedIn: 'root' })
export class ReportTableFacadeService {
  // ---------------------------------
  // 1. Signals for Table & Selection
  // ---------------------------------
  readonly columnsToDisplay = signal([
    'testName',
    'eventName',
    'passed',
    'requestPassed',
    'completedTime'
  ]);

  readonly columnsToDisplayWithExpand = computed(() => [
    'select',
    ...this.columnsToDisplay(),
    'actions'
  ]);

  readonly expandedElement = signal<Report | null>(null);

  // Our table data is a signal of MatTableDataSource
  readonly testDataSource = signal<MatTableDataSource<IReportDetails>>(
    new MatTableDataSource()
  );

  // Selection model as a signal
  readonly selection = signal(new SelectionModel<IReportDetails>(true, []));
  readonly preventNavigationEvents = signal<string[]>([]);
  private readonly projectSlug = signal<string>('');

  // Computed property for "select all" behavior
  readonly isAllSelected = computed(() => {
    const ds = this.testDataSource();
    const numSelected = this.selection().selected.length;
    return ds && numSelected === ds.data.length;
  });

  constructor(
    private projectDataSourceService: ProjectDataSourceService,
    private settingsService: SettingsService,
    private dialog: MatDialog,
    private reportService: ReportService,
    private projectFacadeService: ProjectFacadeService,
    private testRunningFacadeService: TestRunningFacadeService
  ) {
    // ---------------------------------
    // 2. Effects that handle side effects
    // ---------------------------------
    // 2a. Filter effect
    effect(
      () => {
        const filterValue = this.projectDataSourceService.getFilterSignal();
        const currentDataSource = this.testDataSource();
        if (currentDataSource) {
          currentDataSource.filter = filterValue;
        }
      },
      {
        allowSignalWrites: true
      }
    );

    // 2b. Update Settings effect
    effect(
      () => {
        const preventSignal =
          this.projectDataSourceService.getPreventNavigationSignal();
        if (preventSignal) {
          const selectedIds = this.selection().selected.map(
            (item) => item.eventId
          );
          this.settingsService
            .updateSettings(this.projectSlug(), 'preventNavigationEvents', {
              preventNavigationEvents: selectedIds
            })
            .pipe(take(1))
            .subscribe((data) => {
              if (data) {
                // On success
                this.projectDataSourceService.setPreventNavigationSignal(false);
                this.preventNavigationEvents.set(
                  data.settings.preventNavigationEvents
                );
                this.selection().clear();
              }
            });
        }
      },
      {
        allowSignalWrites: true
      }
    );

    // 2c. Delete Confirmation effect
    effect(
      () => {
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
              const remainingReports = this.testDataSource().data.filter(
                (item) => !this.selection().selected.includes(item)
              );
              this.testDataSource().data = remainingReports;
              this.projectDataSourceService.setData(remainingReports);

              this.reportService
                .deleteReports(this.projectSlug(), this.selection().selected)
                .pipe(take(1))
                .subscribe();
            }
            this.projectDataSourceService.setDeletedSignal(false);
          });
        }
      },
      {
        allowSignalWrites: true
      }
    );
  }

  // ---------------------------------
  // 3. Methods to handle table logic
  // ---------------------------------
  initializeData(paginator: MatPaginator, sort: MatSort, data: any) {
    const project = data['projectReport'];
    const projectRecordings = data['recordings'];
    const reportNames = data['reportNames'];
    const projectSettings = data['projectSetting'];

    if (project && paginator && sort) {
      // Sort the data
      const injectReports = (project.reports as IReportDetails[]).sort((a, b) =>
        a.eventName.localeCompare(b.eventName)
      );
      // Create data source and assign
      const dataSource = new MatTableDataSource(injectReports);
      dataSource.paginator = paginator;
      dataSource.sort = sort;
      this.testDataSource.set(dataSource);

      // Initialize statuses via facade
      this.projectFacadeService.initializeRecordingStatus(
        reportNames,
        projectRecordings.recordings
      );
      // Set up signals
      this.preventNavigationEvents.set(
        projectSettings.settings.preventNavigationEvents
      );
      this.projectSlug.set(project.projectSlug);
    }
  }

  runTest(eventId: string) {
    this.testRunningFacadeService
      .runTest(eventId, this.projectSlug(), this.testDataSource())
      .pipe(take(1))
      .subscribe((updatedData) => {
        if (updatedData) {
          this.testDataSource().data = [...updatedData.data];
        }
      });
  }

  toggleAllRows() {
    if (
      this.selection().selected.length === this.testDataSource().data.length
    ) {
      this.selection().clear();
      return;
    }
    // Otherwise, select all
    this.selection().select(...this.testDataSource().data);
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
