import {
  Component,
  OnDestroy,
  viewChild,
  signal,
  computed
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    FormsModule,
    ReactiveFormsModule,
    MatButtonToggleModule
  ],
  templateUrl: './file-table-toolbar.component.html',
  styleUrls: ['./file-table-toolbar.component.scss']
})
export class FileTableToolbarComponent implements OnDestroy {
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

  constructor(
    private readonly fileTableDataSourceService: FileTableDataSourceService,
    private readonly fileTableDataSourceModelService: FileTableDataSourceModelService
  ) {}

  applyFilter(event: Event) {
    console.log('event', event);
    const filterValue = (event.target as HTMLInputElement).value;
    console.log('filter value in applyFilter', filterValue);
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
