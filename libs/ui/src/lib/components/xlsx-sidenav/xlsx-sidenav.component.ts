import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { EventBusService, XlsxProcessFacade } from '@data-access';
import {
  Subject,
  combineLatest,
  switchMap,
  takeUntil,
  takeWhile,
  tap,
  timer
} from 'rxjs';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ProgressSpinnerComponent } from '../progress-spinner/progress-spinner.component';
import { CustomMatTableComponent } from '../custom-mat-table/custom-mat-table.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'lib-xlsx-sidenav-form',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTableModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    ProgressSpinnerComponent,
    CustomMatTableComponent
  ],
  templateUrl: `./xlsx-sidenav.component.html`,
  styleUrls: ['./xlsx-sidenav.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class XlsxSidenavComponent implements AfterViewInit, OnDestroy {
  public xlsxFacadeService = inject(XlsxProcessFacade);
  private readonly eventBusService = inject(EventBusService);
  private readonly fb = inject(FormBuilder);

  sidenav = viewChild<MatSidenav>('sidenav');
  scrollContainer = viewChild<ElementRef>('scrollContainer');

  private readonly destroy$ = new Subject<void>();

  file: File | undefined;
  loading = true;
  dataColumnNameString = 'dataLayer Specs';
  form = this.fb.group({
    worksheetNames: [''],
    dataColumnName: [this.dataColumnNameString, Validators.required]
  });

  numTotalTags = this.xlsxFacadeService.numTotalEvents;
  numParsedTags = this.xlsxFacadeService.numParsedEvents;
  displayedColumns$ =
    this.xlsxFacadeService.xlsxProcessService.xlsxDisplayService
      .displayedColumns$;
  displayedFailedColumns$ =
    this.xlsxFacadeService.xlsxProcessService.xlsxDisplayService
      .displayedColumns$;
  displayedFailedEvents$ =
    this.xlsxFacadeService.xlsxProcessService.xlsxDisplayService
      .displayedFailedEvents$;
  hasProcessedFailedEvents$ = computed(
    () => this.displayedFailedEvents$().length > 0
  );
  displayedDataSource$ =
    this.xlsxFacadeService.xlsxProcessService.xlsxDisplayService
      .displayedDataSource$;
  worksheetNames$ =
    this.xlsxFacadeService.xlsxProcessService.workbookService.worksheetNames$;
  fileName$ =
    this.xlsxFacadeService.xlsxProcessService.workbookService.fileName$;

  // Lifecycle hooks
  ngAfterViewInit() {
    this.initEventBusListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // UI event handlers
  toggleSidenav() {
    this.adjustBodyOverflow();
    this.isLoading().subscribe();
  }

  private adjustBodyOverflow() {
    if (!this.sidenav) return;
    this.sidenav()?.toggle();
    document.body.style.overflow = this.sidenav()?.opened ? 'hidden' : 'auto';
  }

  private isLoading() {
    const spinningTime = 1;
    return combineLatest({
      timer: timer(0, 500)
    }).pipe(
      takeWhile(({ timer }) => timer <= spinningTime),
      tap(({ timer }) => {
        const workbook =
          this.xlsxFacadeService.xlsxProcessService.workbookService.workbook$();
        const dataSource =
          this.xlsxFacadeService.xlsxProcessService.xlsxDisplayService.dataSource$();
        const displayedDataSource =
          this.xlsxFacadeService.xlsxProcessService.xlsxDisplayService.displayedDataSource$();
        const displayedColumns =
          this.xlsxFacadeService.xlsxProcessService.xlsxDisplayService.displayedColumns$();
        if (
          !workbook ||
          !dataSource ||
          !displayedDataSource ||
          !displayedColumns
        ) {
          this.loading = true;
        } else if (timer === spinningTime) {
          this.loading = false;
        } else {
          this.loading = true;
        }
      })
    );
  }

  // Event bus listeners
  private initEventBusListeners() {
    this.eventBusService
      .on('toggleDrawer')
      .pipe(
        takeUntil(this.destroy$),
        tap(() => this.toggleSidenav()),
        switchMap((file) => this.xlsxFacadeService.loadXlsxFile(file))
      )
      .subscribe();
  }

  // facade service handlers
  switchToSelectedSheet(event: Event) {
    if (!event.target) {
      throw new Error('Event target is undefined');
    }
    const name = (event.target as HTMLInputElement).value;
    const workbook =
      this.xlsxFacadeService.xlsxProcessService.workbookService.workbook$();
    this.xlsxFacadeService.withWorkbookHandling(workbook, 'switchSheet', name);
  }

  onAction(action: string) {
    const dataColumnName = this.dataColumnName?.value;
    this.xlsxFacadeService.onAction(action, dataColumnName);
  }

  // getters
  get dataColumnName() {
    return this.form.controls.dataColumnName;
  }
}
