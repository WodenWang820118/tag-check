import {
  Component,
  viewChild,
  OnInit,
  DestroyRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { tap } from 'rxjs';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DatePipe, NgClass, CommonModule } from '@angular/common';
import { MatSort, Sort, MatSortModule } from '@angular/material/sort';
import { getCheckStatus, Jsonified, RunSummary } from '@utils';
import { MatInputModule } from '@angular/material/input';
import { FileTableDataSourceFacadeService } from './file-table-data-source-facade.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableSortService } from '../../../../shared/services/utils/table-sort.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RunStatusChipComponent } from '../run-status-chip/run-status-chip.component';

/**
 * The Reports page's table: one row per run with its status, sortable
 * and paged, selected rows being what the toolbar acts on.
 */
@Component({
  selector: 'app-file-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatCheckboxModule,
    DatePipe,
    MatInputModule,
    NgClass,
    MatSortModule,
    MatChipsModule,
    MatTooltipModule,
    RunStatusChipComponent,
    CommonModule
  ],
  templateUrl: './file-table.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./file-table.component.css']
})
export class FileTableComponent implements OnInit {
  paginator = viewChild.required<MatPaginator>(MatPaginator);
  sort = viewChild.required<MatSort>(MatSort);

  constructor(
    private readonly facade: FileTableDataSourceFacadeService,
    private readonly route: ActivatedRoute,
    private readonly destroyRef: DestroyRef,
    private readonly tableSortService: TableSortService
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

  sortData(sort: Sort) {
    this.dataSource.data = this.tableSortService.sortData(
      sort,
      this.dataSource.data,
      [
        { name: 'eventName', type: 'string' },
        { name: 'testName', type: 'string' },
        {
          name: 'status',
          type: 'number',
          accessor: (row: Jsonified<RunSummary>) => {
            const dl = row?.passed === true;
            const req = row?.requestPassed === true;
            if (dl && req) return 3; // Passed
            if (dl || req) return 2; // Partial
            return 1; // Failed
          }
        },
        {
          name: 'completedTime',
          type: 'date',
          accessor: (row: Jsonified<RunSummary>) => row.runAt
        }
      ]
    );
  }

  /** Every listed run finished, so its status follows from its two checks. */
  runStatus(run: Jsonified<RunSummary>) {
    return getCheckStatus(run.passed, run.requestPassed);
  }

  // The following getters make it easier to use signals in the template:
  get columns() {
    return this.facade.columns();
  }

  get dataSource() {
    return this.facade.dataSource;
  }

  get selection() {
    return this.facade.selection;
  }

  get isAllSelected() {
    return this.facade.isAllSelected;
  }

  toggleAllRows() {
    this.facade.toggleAllRows();
  }

  /** Toggle selection of a single row via facade */
  toggleSelection(row: Jsonified<RunSummary>) {
    this.facade.toggleRow(row);
  }

  checkboxLabel(row?: Jsonified<RunSummary>) {
    return this.facade.checkboxLabel(row);
  }
}
