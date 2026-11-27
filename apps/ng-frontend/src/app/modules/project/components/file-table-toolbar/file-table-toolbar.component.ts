import {
  Component,
  OnDestroy,
  viewChild,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import {
  MatButtonToggleChange,
  MatButtonToggleModule
} from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FileTableDataSourceService } from '../../../../shared/services/data-source/file-table-data-source.service';
import { FileTableDataSourceModelService } from '../../services/file-table-data-source-model/file-table-data-source-model.service';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * The Reports page's toolbar: delete or download the selected runs, and
 * filter the table. When History opened the page for one event, a chip
 * names it and removing the chip lists every run again.
 */
@Component({
  selector: 'app-file-table-toolbar',
  standalone: true,
  imports: [
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonToggleModule,
    MatChipsModule
  ],
  templateUrl: './file-table-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./file-table-toolbar.component.scss']
})
export class FileTableToolbarComponent implements OnDestroy {
  private readonly fileTableDataSourceService = inject(
    FileTableDataSourceService
  );
  private readonly fileTableDataSourceModelService = inject(
    FileTableDataSourceModelService
  );
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isSearchVisible = signal(false);
  filterValue = signal('');
  searchInput = viewChild<HTMLInputElement>('searchInput');
  // Whether at least one row is currently selected in the file table
  hasSelection = computed(() =>
    this.fileTableDataSourceModelService.selection().selected.some(Boolean)
  );
  // Whether the table currently has any data rows
  hasData = computed(
    () =>
      (this.fileTableDataSourceModelService.dataSource()?.data?.length || 0) > 0
  );

  /** The event whose runs are listed (`?event=`); empty for every run. */
  eventFilter = computed(() =>
    this.fileTableDataSourceService.getEventFilterSignal()
  );

  /** Drops `?event=`, which lists every run again. */
  clearEventFilter() {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { event: null },
      queryParamsHandling: 'merge'
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.fileTableDataSourceService.setFilterSignal(filterValue);
  }

  deleteSelected() {
    this.fileTableDataSourceService.setDeletedSignal(true);
  }

  onToggleChange(event: MatButtonToggleChange) {
    if (event.value === 'search') {
      this.isSearchVisible.update((value) => !value);
    }
  }

  downloadSelected() {
    this.fileTableDataSourceService.setDownloadSignal(true);
  }

  private setSearchInputValue(value: string) {
    const input = this.searchInput();
    if (input) {
      input.value = value;
      this.filterValue.set(value);
    }
  }

  private resetSearch(): void {
    this.setSearchInputValue('');
    this.filterValue.set('');
  }

  ngOnDestroy() {
    this.resetSearch();
  }
}
