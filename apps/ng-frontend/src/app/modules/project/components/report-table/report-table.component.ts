import { ProjectDataSourceService } from '../../../../shared/services/project-data-source/project-data-source.service';
import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';
import {
  EMPTY,
  Observable,
  Subject,
  combineLatest,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { IReportDetails } from '../../../../shared/models/report.interface';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReportDetailsService } from '../../../../shared/services/report-details/report-details.service';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { ReportService } from '../../../../shared/services/api/report/report.service';
import { Project } from '../../../../shared/models/project.interface';
import { DataLayerService } from '../../../../shared/services/api/datalayer/datalayer.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { MatBadgeModule } from '@angular/material/badge';
import { SettingsService } from '../../../../shared/services/api/settings/settings.service';
import { InspectEvent } from '../../../../shared/models/inspectData.interface';

@Component({
  selector: 'app-report-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    MatPaginatorModule,
    MatInputModule,
    MatCheckboxModule,
    MatBadgeModule,
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
  templateUrl: './report-table.component.html',
  styleUrls: ['./report-table.component.scss'],
})
export class ReportTableComponent implements OnInit, OnDestroy {
  columnsToDisplay = ['eventName', 'passed', 'completedTime'];
  columnsToDisplayWithExpand = ['select', ...this.columnsToDisplay, 'expand'];
  expandedElement: Report | null = null;
  testDataSource!: MatTableDataSource<IReportDetails>;
  selection = new SelectionModel<IReportDetails>(true, []);
  preventNavigationEvents: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @Input() project$!: Observable<Project>;

  destroy$ = new Subject<void>();

  constructor(
    private reportService: ReportService,
    private reportDetailsService: ReportDetailsService,
    private projectDataSourceService: ProjectDataSourceService,
    private route: ActivatedRoute,
    private dataLayerService: DataLayerService,
    private settingsService: SettingsService
  ) {}

  ngOnInit() {
    this.subscribeToRouteChanges();
    this.observeTableFilter();
    this.observeDeleteSelected();
    this.observeNavigationEvents();
    this.observePreventNavigationSelected();
  }

  getNewPreventNavigationEvents(events: string[]): string[] {
    // Create a copy of the current preventNavigationEvents to modify
    let newSettings: string[] = [...this.preventNavigationEvents];

    for (const receivedEvent of events) {
      const index = newSettings.indexOf(receivedEvent);

      if (index > -1) {
        // Event is found, remove it (toggle behavior)
        newSettings.splice(index, 1);
      } else {
        // Event is new, add it to the array
        newSettings.push(receivedEvent);
      }
    }

    // If original array was empty, just return the new events
    if (!this.preventNavigationEvents.length) {
      newSettings = [...events];
    }

    return newSettings;
  }

  observeNavigationEvents() {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const slug = params['projectSlug'];
          return this.settingsService.getProjectSettings(slug);
        }),
        tap((project) => {
          this.preventNavigationEvents =
            project.settings['preventNavigationEvents'];
        })
      )
      .subscribe();
  }

  observePreventNavigationSelected() {
    combineLatest([
      this.route.params,
      this.projectDataSourceService.getPreventNavigationStream(),
    ])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([params, value]) => {
          const projectSlug = params['projectSlug'];
          if (value === true) {
            // reset the prevent navigation stream
            this.projectDataSourceService.setPreventNavigationStream(false);
            // delete the selected reports
            const eventNames = this.selection.selected.map(
              (item) => item.eventName
            );
            this.preventNavigationEvents =
              this.getNewPreventNavigationEvents(eventNames);
            this.selection.clear();
            return this.settingsService.updateSettings(
              projectSlug,
              'preventNavigationEvents',
              {
                preventNavigationEvents: eventNames,
              }
            );
          }
          return EMPTY;
        })
      )
      .subscribe();
  }

  observeDeleteSelected() {
    combineLatest([
      this.route.params,
      this.projectDataSourceService.getDeletedStream(),
    ])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([params, value]) => {
          const projectSlug = params['projectSlug'];
          if (value === true) {
            console.log('delete selected in the report table component');
            // reset the deleted stream
            this.projectDataSourceService.setDeletedStream(false);
            // delete the selected reports
            const remainingReports = this.testDataSource.data.filter(
              (item) => !this.selection.selected.includes(item)
            );
            this.testDataSource.data = remainingReports;
            return this.reportService.deleteReports(
              projectSlug,
              this.selection.selected
            );
          }
          return EMPTY;
        })
      )
      .subscribe();
  }

  observeTableFilter() {
    this.projectDataSourceService
      .getFilterStream()
      .pipe(
        takeUntil(this.destroy$),
        tap((filter) => {
          this.testDataSource.filter = filter;
        })
      )
      .subscribe();
  }

  subscribeToRouteChanges() {
    // when the route changes, get the project reports and initialize the data source
    // otherwise, update the data source when the project reports change
    combineLatest([this.route.params, this.project$])
      .pipe(
        takeUntil(this.destroy$),
        switchMap(([params, project]) => {
          const slug = params['projectSlug'];
          return this.reportService.getProjectReports(slug).pipe(
            tap((project) => {
              if (project) {
                this.initializeDataSource(project.reports);
              }
            })
          );
        })
      )
      .subscribe();
  }

  initializeDataSource(reports: IReportDetails[]) {
    this.testDataSource = new MatTableDataSource(reports);
    // Make sure to set paginator and sort after view init
    setTimeout(() => {
      this.testDataSource.paginator = this.paginator;
      this.testDataSource.sort = this.sort;
      this.projectDataSourceService.setData(reports);
    });
  }

  setReportDetails(eventName: string) {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const slug = params['projectSlug'];
          return this.reportService.getProjectReports(slug).pipe(
            tap((project) => {
              if (project) {
                const reports = project.reports;
                const report = reports.find(
                  (item) => item.eventName === eventName
                );
                this.reportDetailsService.setReportDetails(report);
              }
            })
          );
        })
      )
      .subscribe();
  }

  runTest(eventName: string) {
    console.log('running test', eventName);
    combineLatest([this.route.params, this.project$])
      .pipe(
        take(1),
        switchMap(([params, project]) => {
          const slug = params['projectSlug'];
          const headless = project.headless;
          const inspectEventDto: InspectEvent = {
            application: {
              localStorage: {
                data: [...project.application.localStorage.data],
              },
              cookie: {
                data: [...project.application.cookie.data],
              },
            },
            puppeteerArgs: project.browser,
          };
          return this.dataLayerService.runDataLayerCheck(
            slug,
            eventName,
            headless,
            inspectEventDto
          );
        })
      )
      .subscribe();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    if (!this.testDataSource) {
      return;
    }

    const numSelected = this.selection.selected.length;
    const numRows = this.testDataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.testDataSource.data);
    console.log('selected', this.selection.selected);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: IReportDetails): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${
      row.position + 1
    }`;
  }

  ngOnDestroy() {
    console.log('destroying report-table');
    this.destroy$.next();
    this.destroy$.complete();
  }
}
