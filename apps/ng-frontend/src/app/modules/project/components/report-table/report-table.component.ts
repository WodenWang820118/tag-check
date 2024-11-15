import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  signal,
  viewChild
} from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EMPTY, switchMap, take, tap, firstValueFrom } from 'rxjs';
import { IReportDetails } from '@utils';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatBadgeModule } from '@angular/material/badge';
import { DataSourceFacadeService } from '../../../../shared/services/facade/data-source-facade.service';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { ProjectFacadeService } from '../../../../shared/services/facade/project-facade.service';
import { ProgressPieChartComponent } from '../progress-pie-chart/progress-pie-chart.component';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-report-table',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    NgClass,
    MatTableModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    MatPaginatorModule,
    MatInputModule,
    MatCheckboxModule,
    MatBadgeModule,
    ProgressPieChartComponent
  ],
  providers: [
    ProjectFacadeService,
    DataSourceFacadeService,
    TestRunningFacadeService
  ],
  templateUrl: './report-table.component.html',
  styleUrls: ['./report-table.component.scss']
})
export class ReportTableComponent implements AfterViewInit {
  // State signals
  readonly columnsToDisplay = signal([
    'testName',
    'eventName',
    'passed',
    'requestPassed',
    'completedTime'
  ]);

  readonly columnsToDisplayWithExpand = signal([
    'select',
    ...this.columnsToDisplay(),
    'actions'
  ]);

  readonly expandedElement = signal<Report | null>(null);
  readonly testDataSource = signal<MatTableDataSource<IReportDetails>>(
    new MatTableDataSource()
  );
  readonly selection = signal(new SelectionModel<IReportDetails>(true, []));
  readonly preventNavigationEvents = signal<string[]>([]);
  private params = toSignal(this.route.params, {
    initialValue: {
      projectSlug: ''
    }
  });

  // View children
  private readonly paginator = viewChild<MatPaginator>(MatPaginator);
  private readonly sort = viewChild<MatSort>(MatSort);

  // Computed values
  readonly isAllSelected = computed(() => {
    const dataSource = this.testDataSource();
    if (!dataSource) return false;

    const numSelected = this.selection().selected.length;
    const numRows = dataSource.data.length;
    return numSelected === numRows;
  });

  constructor(
    public projectFacadeService: ProjectFacadeService,
    public dataSourceFacadeService: DataSourceFacadeService,
    public testRunningFacadeService: TestRunningFacadeService,
    private route: ActivatedRoute,
    private destroyRef: DestroyRef
  ) {}

  ngAfterViewInit() {
    const paginator = this.paginator();
    const sort = this.sort();
    if (this.params().projectSlug && paginator && sort) {
      this.setupProjectObservation(paginator, sort);
    }
  }

  private async setupProjectObservation(
    paginator: MatPaginator,
    sort: MatSort
  ) {
    this.observeProject(paginator, sort)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    await this.observeProjectRecordingStatus();

    this.projectFacadeService
      .observeNavigationEvents()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((preventNavigationEvents) => {
          this.preventNavigationEvents.set(preventNavigationEvents);
        })
      )
      .subscribe();

    this.dataSourceFacadeService
      .observeTableFilter()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((filter) => {
          this.testDataSource().filter = filter;
        })
      )
      .subscribe();

    this.dataSourceFacadeService
      .observePreventNavigationSelected(this.selection())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((projectSetting) => {
          if (!projectSetting) return;
          this.preventNavigationEvents.set(
            projectSetting.settings.preventNavigationEvents
          );
        })
      )
      .subscribe();
  }

  async observeProjectRecordingStatus() {
    await firstValueFrom(
      this.projectFacadeService.observeProjectRecordingStatus(
        this.params().projectSlug
      )
    );
  }

  observeProject(paginator: MatPaginator, sort: MatSort) {
    return this.dataSourceFacadeService.observeProject(paginator, sort).pipe(
      switchMap(
        (dataSource: MatTableDataSource<IReportDetails, MatPaginator>) => {
          if (dataSource) {
            this.testDataSource.set(dataSource);
            return this.dataSourceFacadeService.observeDeleteSelected(
              this.selection(),
              this.testDataSource()
            );
          }
          return EMPTY;
        }
      )
    );
  }

  runTest(eventId: string) {
    this.testRunningFacadeService
      .runTest(eventId, this.params().projectSlug, this.testDataSource())
      .pipe(take(1))
      .subscribe((updatedData) => {
        if (updatedData) {
          this.testDataSource().data = [...updatedData.data];
        }
      });
  }

  selectSingleRow(row: IReportDetails) {
    this.selection().toggle(row);
    this.selection().select(row);
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection().clear();
      return;
    }

    this.selection().select(...this.testDataSource().data);
    console.log('selected', this.selection().selected);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: IReportDetails): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection().isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }
}
