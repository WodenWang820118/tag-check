import {
  Component,
  ViewChild,
  AfterViewInit,
  ElementRef,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
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
import { ActivatedRoute } from '@angular/router';
import { tap, takeUntil, Subject, map, catchError, of } from 'rxjs';

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
})
export class FileTableToolbarComponent implements AfterViewInit, OnDestroy {
  isSearchVisible = false;
  destroy$ = new Subject<void>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fileTableDataSourceService: FileTableDataSourceService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    this.initializeFilterValue()
      .pipe(
        takeUntil(this.destroy$),
        tap((value) => {
          if (value) {
            this.showSearch();
            this.setSearchInputValue(value);
            this.triggerApplyFilter();
          }
        })
      )
      .subscribe();
  }

  applyFilter(event: Event) {
    console.log('event', event);
    const filterValue = (event.target as HTMLInputElement).value;
    console.log('filter value in applyFilter', filterValue);
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

  private initializeFilterValue() {
    return this.route.queryParams.pipe(
      takeUntil(this.destroy$),
      map((params) => {
        const eventName: string = params['event'];
        if (eventName) {
          console.log('event name in the toolbar', eventName);
          return eventName;
        }
        return '';
      }),
      catchError((error) => {
        console.error(error);
        return of('');
      })
    );
  }

  private setSearchInputValue(value: string) {
    if (this.searchInput && this.searchInput.nativeElement) {
      this.searchInput.nativeElement.value = value;
      this.cdr.detectChanges(); // avoid RuntimeError: NG0100: ExpressionChangedAfterItHasBeenCheckedError
    }
  }

  private showSearch() {
    this.isSearchVisible = true;
    this.cdr.detectChanges(); // avoid RuntimeError: NG0100: ExpressionChangedAfterItHasBeenCheckedError
  }

  private triggerApplyFilter() {
    console.log('trigger apply filter');
    if (this.searchInput && this.searchInput.nativeElement) {
      const event = new KeyboardEvent('keyup', {
        bubbles: true,
        cancelable: true,
        composed: true,
      });
      this.searchInput.nativeElement.dispatchEvent(event);
    }
  }

  private resetSearch(): void {
    this.setSearchInputValue('');
    this.fileTableDataSourceService.setFilter('');
    this.triggerApplyFilter();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.resetSearch();
  }
}
