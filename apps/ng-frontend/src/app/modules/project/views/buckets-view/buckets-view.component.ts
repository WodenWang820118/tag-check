import { Component } from '@angular/core';
import { FileTableComponent } from '../../components/file-table/file-table.component';
import { FileTableToolbarComponent } from '../../components/file-table-toolbar/file-table-toolbar.component';

@Component({
  selector: 'app-bucket-view',
  standalone: true,
  imports: [FileTableComponent, FileTableToolbarComponent],
  template: `
    <div class="bucket-view">
      <div class="mat-elevation-z4">
        <app-file-table-toolbar></app-file-table-toolbar>
        <app-file-table></app-file-table>
      </div>
    </div>
  `,
  styles: `
    .bucket-view {
      padding-top: 5rem;
      padding-left: 20rem;
      padding-right: 10rem;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  `
})
export class BucketsViewComponent {}
