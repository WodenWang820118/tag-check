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
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatBadgeModule } from '@angular/material/badge';
import { TestRunningFacadeService } from '../../../../shared/services/facade/test-running-facade.service';
import { ProgressPieChartComponent } from '../progress-pie-chart/progress-pie-chart.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReportTableFacadeService } from './report-table-facade.service';
import { TableSortService } from '../../../../shared/services/utils/table-sort.service';

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
  private readonly paginator = viewChild<MatPaginator>(MatPaginator);
  private readonly sort = viewChild<MatSort>(MatSort);

  constructor(
    public testRunningFacadeService: TestRunningFacadeService,
    private route: ActivatedRoute,
    private destroyRef: DestroyRef,
    private facade: ReportTableFacadeService,
    private tableSortService: TableSortService
  ) {}
  // TODO: retrieve the pass or not information from the test event details
  ngOnInit() {
    const paginator = this.paginator();
    const sort = this.sort();
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .pipe(
        tap((data) => {
          console.warn('data: ', data);
          if (paginator && sort)
            this.facade.initializeData(paginator, sort, data);
        })
      )
      .subscribe();
  }

  sortData(sort: Sort) {
    this.dataSource.data = this.tableSortService.sortData(
      sort,
      this.dataSource.data,
      this.columns.map((col) => ({ name: col, type: 'string' }))
    );
  }

  // The following getters make it easier to use signals in the template:
  get columns() {
    return this.facade.columns();
  }

  get columnsWithExpand() {
    return this.facade.columnsWithExpand();
  }

  get dataSource() {
    return this.facade.dataSource();
  }

  get selection() {
    return this.facade.selection();
  }

  get isAllSelected() {
    return this.facade.isAllSelected();
  }

  hasRecording(eventId: string) {
    return this.facade.hasRecording(eventId);
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
