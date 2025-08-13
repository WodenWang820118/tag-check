import {
  Component,
  input,
  model,
  computed,
  viewChild,
  effect,
  ViewEncapsulation
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator
} from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [MatButtonModule, MatPaginatorModule, MatIconModule],
  template: `
    <mat-paginator
      #paginator
      (page)="handlePageEvent($event)"
      [length]="length()"
      [pageSize]="pageSize()"
      [disabled]="disabled()"
      [showFirstLastButtons]="showFirstLastButtons()"
      [pageSizeOptions]="showPageSizeOptions() ? pageSizeOptions() : []"
      [hidePageSize]="hidePageSize()"
      [pageIndex]="pageIndex()"
      aria-label="Select page"
    >
    </mat-paginator>
  `,
  styles: [
    `
      .mat-mdc-paginator-range-label {
        display: none;
      }

      .mat-mdc-mini-fab {
        --mdc-fab-small-container-shape: 5px;
        margin-right: 1rem;
      }

      .mat-mdc-icon-button[disabled] .mat-mdc-paginator-icon {
        fill: rgba(0, 0, 0, 0.2) !important;
      }
    `
  ],
  encapsulation: ViewEncapsulation.None
})
export class PaginatorComponent {
  // Inputs as signals
  length = input<number>(0);
  pageSize = input<number>(5);
  pageSizeOptions = input<number[]>([5, 10, 25, 100]);

  // State signals
  pageIndex = model<number>(0);
  hidePageSize = input<boolean>(true);
  showPageSizeOptions = input<boolean>(false);
  showFirstLastButtons = input<boolean>(false);
  disabled = input<boolean>(false);

  // Paginator reference as signal
  paginator = viewChild.required<MatPaginator>('paginator');

  // Computed signals for derived state
  currentPage = computed(() => this.pageIndex());

  constructor() {
    // Effect to handle paginator initialization
    effect(() => {
      const paginatorInstance = this.paginator();
      if (paginatorInstance && this.length() !== null) {
        paginatorInstance.length = this.length();
        paginatorInstance.pageSize = this.pageSize();
      }
    });
  }

  handlePageEvent(e: PageEvent) {
    // Update the page index model
    this.pageIndex.set(e.pageIndex);
  }
}
