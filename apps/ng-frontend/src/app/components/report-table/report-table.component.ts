import { ProjectDataSourceService } from '../../services/project-data-source/project-data-source.service';
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
  Observable,
  Subscription,
  combineLatest,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { ReportDetails } from '../../models/report.interface';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReportDetailsService } from '../../services/report-details/report-details.service';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { ReportService } from '../../services/api/report/report.service';
import { Project } from '../../models/project.interface';

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
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: Report | null = null;
  testDataSource!: MatTableDataSource<ReportDetails>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @Input() project$!: Observable<Project>;

  subscriptions: Subscription[] = [];

  constructor(
    private reportService: ReportService,
    private reportDetailsService: ReportDetailsService,
    private projectDataSourceService: ProjectDataSourceService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.subscribeToRouteChanges();
  }

  subscribeToRouteChanges() {
    // when the route changes, get the project reports and initialize the data source
    // otherwise, update the data source when the project reports change
    const routeSubscription = combineLatest([this.route.params, this.project$])
      .pipe(
        take(1),
        switchMap(([params, project]) => {
          const slug = params['projectSlug'];
          return this.reportService.getProjectReports(slug).pipe(
            tap((project) => {
              this.initializeDataSource(project.reports);
            })
          );
        })
      )
      .subscribe();

    this.subscriptions.push(routeSubscription);
  }

  initializeDataSource(reports: ReportDetails[]) {
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

  ngOnDestroy() {
    console.log('destroying report-table');
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
