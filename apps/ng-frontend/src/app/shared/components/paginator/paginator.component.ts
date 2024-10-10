import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  PageEvent,
  MatPaginatorModule,
  MatPaginator,
} from '@angular/material/paginator';
import { StylePaginatorDirective } from '../../directives/style-paginator.directive';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [
    MatButtonModule,
    MatPaginatorModule,
    StylePaginatorDirective,
    MatIconModule,
  ],
  template: `
    <mat-paginator
      #paginator
      appStylePaginator
      [showTotalPages]="2"
      (page)="handlePageEvent($event)"
      [length]="length"
      [pageSize]="pageSize"
      [disabled]="disabled"
      [showFirstLastButtons]="showFirstLastButtons"
      [pageSizeOptions]="showPageSizeOptions ? pageSizeOptions : []"
      [hidePageSize]="hidePageSize"
      [pageIndex]="pageIndex"
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
    `,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class PaginatorComponent implements OnChanges {
  @Input() length!: number | null;
  @Input() pageSize!: number;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 100];

  pageIndex = 0;
  hidePageSize = true;
  showPageSizeOptions = false;
  showFirstLastButtons = false;
  disabled = false;
  pageEvent!: PageEvent;

  @ViewChild('paginator', { static: true }) paginator!: MatPaginator;

  constructor(private cdr: ChangeDetectorRef) {}

  handlePageEvent(e: PageEvent) {
    this.pageEvent = e;
    this.length = e.length;
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
  }

  private triggerInitialPageEvent() {
    // Create an initial PageEvent
    if (this.length === 0 || !this.length) return;
    const initialPageEvent: PageEvent = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      length: this.length,
    };

    // Trigger the handlePageEvent method
    this.paginator.page.emit(initialPageEvent);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['length'] || changes['pageSize']) {
      setTimeout(() => {
        this.triggerInitialPageEvent();
        this.cdr.detectChanges();
      });
    }
  }
}
