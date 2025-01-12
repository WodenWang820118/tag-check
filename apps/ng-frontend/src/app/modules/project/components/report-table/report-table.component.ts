import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  signal,
  viewChild
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { tap } from 'rxjs';
import { IReportDetails } from '@utils';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatBadgeModule } from '@angular/material/badge';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { ProjectFacadeService } from '../../../../shared/services/facade/project-facade.service';
import { ProgressPieChartComponent } from '../progress-pie-chart/progress-pie-chart.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReportTableFacadeService } from './report-table-facade.service';

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
  templateUrl: './report-table.component.html',
  styleUrls: ['./report-table.component.scss']
})
export class ReportTableComponent implements OnInit {
  readonly preventNavigationEvents = signal<string[]>([]);
  private readonly paginator = viewChild<MatPaginator>(MatPaginator);
  private readonly sort = viewChild<MatSort>(MatSort);

  constructor(
    public projectFacadeService: ProjectFacadeService,
    public testRunningFacadeService: TestRunningFacadeService,
    private route: ActivatedRoute,
    private destroyRef: DestroyRef,
    public facade: ReportTableFacadeService
  ) {}

  ngOnInit() {
    const paginator = this.paginator();
    const sort = this.sort();
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .pipe(
        tap((data) => {
          if (paginator && sort)
            this.facade.initializeData(paginator, sort, data);
        })
      )
      .subscribe();
  }

  // The following getters make it easier to use signals in the template:
  get columnsToDisplay() {
    return this.facade.columnsToDisplay();
  }

  get columnsToDisplayWithExpand() {
    return this.facade.columnsToDisplayWithExpand();
  }

  get testDataSource() {
    return this.facade.testDataSource();
  }

  get selection() {
    return this.facade.selection();
  }

  get isAllSelected() {
    return this.facade.isAllSelected();
  }

  // Expose methods directly:
  runTest(eventId: string) {
    this.facade.runTest(eventId);
  }

  toggleAllRows() {
    this.facade.toggleAllRows();
  }

  checkboxLabel(row?: IReportDetails) {
    return this.facade.checkboxLabel(row);
  }
}
