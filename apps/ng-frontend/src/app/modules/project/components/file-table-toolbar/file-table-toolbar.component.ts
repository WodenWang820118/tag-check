import {
  Component,
  AfterViewInit,
  OnDestroy,
  viewChild,
  signal,
  effect,
  DestroyRef
} from '@angular/core';
import {
  MatButtonToggleChange,
  MatButtonToggleModule
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
import { tap, map, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
export class FileTableToolbarComponent implements AfterViewInit, OnDestroy {
  isSearchVisible = signal(false);
  filterValue = signal('');
  searchInput = viewChild.required<HTMLInputElement>('searchInput');

  constructor(
    private fileTableDataSourceService: FileTableDataSourceService,
    private route: ActivatedRoute,
    private destroyRef: DestroyRef
  ) {
    // Initialize filter value from route params
    effect(() => {
      this.initializeFilterValue();
    });

    // Effect for filter changes
    effect(() => {
      const currentFilter = this.filterValue();
      this.fileTableDataSourceService.setFilter(currentFilter);
    });
  }

  ngAfterViewInit() {
    this.initializeFilterValue()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((value) => {
          if (value) {
            this.isSearchVisible.update(() => true);
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
    if (event.value === 'search') {
      this.isSearchVisible.update((value) => !value);
    }
  }

  downloadSelected() {
    this.fileTableDataSourceService.downloadSelected();
  }

  private initializeFilterValue() {
    return this.route.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef),
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
    if (this.searchInput()) {
      this.searchInput().value = value;
      this.filterValue.set(value);
    }
  }

  private triggerApplyFilter() {
    if (this.searchInput()) {
      const event = new KeyboardEvent('keyup', {
        bubbles: true,
        cancelable: true,
        composed: true
      });
      this.searchInput().dispatchEvent(event);
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
