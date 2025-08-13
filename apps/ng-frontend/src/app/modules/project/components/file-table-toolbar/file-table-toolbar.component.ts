import { Component, OnDestroy, viewChild, signal } from '@angular/core';
import {
  MatButtonToggleChange,
  MatButtonToggleModule
} from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FileTableDataSourceService } from '../../../../shared/services/data-source/file-table-data-source.service';
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

  constructor(
    private readonly fileTableDataSourceService: FileTableDataSourceService
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
