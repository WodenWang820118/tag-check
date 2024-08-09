import { Component, ViewEncapsulation } from '@angular/core';
import {
  MatButtonToggleChange,
  MatButtonToggleModule,
} from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FileTableDataSourceService } from '../../../../shared/services/file-table-data-source/file-table-data-source.service';
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
    MatButtonToggleModule,
  ],
  templateUrl: './file-table-toolbar.component.html',
  styleUrls: ['./file-table-toolbar.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FileTableToolbarComponent {
  isSearchVisible = false;

  constructor(private fileTableDataSourceService: FileTableDataSourceService) {}
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.fileTableDataSourceService.setFilter(filterValue);
  }
  deleteSelected() {
    this.fileTableDataSourceService.deleteSelected();
  }
  onToggleChange(event: MatButtonToggleChange) {
    console.log(event.value);
    if (event.value === 'search') {
      this.isSearchVisible = !this.isSearchVisible;
    }
  }

  downloadSelected() {
    this.fileTableDataSourceService.downloadSelected();
  }
}
