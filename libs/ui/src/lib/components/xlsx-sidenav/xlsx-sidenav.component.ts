import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { EventBusService, XlsxProcessFacade } from '@data-access';
import {
  Observable,
  Subject,
  combineLatest,
  map,
  switchMap,
  takeUntil,
  takeWhile,
  tap,
  timer
} from 'rxjs';
import { ViewEncapsulation } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ProgressSpinnerComponent } from '../progress-spinner/progress-spinner.component';
import { CustomMatTableComponent } from '../custom-mat-table/custom-mat-table.component';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'lib-xlsx-sidenav-form',
  standalone: true,
  imports: [
    AsyncPipe,
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
  private eventBusService = inject(EventBusService);
  private fb = inject(FormBuilder);

  @ViewChild('sidenav') sidenav: MatSidenav | undefined;
  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;

  fileName$ = this.xlsxFacadeService.fileName$ as Observable<string>;
  worksheetNames$ = this.xlsxFacadeService.worksheetNames$ as Observable<
    string[]
  >;
  workbook$ = this.xlsxFacadeService.workbook$ as Observable<any>;
  dataSource$ = this.xlsxFacadeService.dataSource$ as Observable<any[]>;
  displayedDataSource$ = this.xlsxFacadeService
    .displayedDataSource$ as Observable<any[]>;
  displayedColumns$ = this.xlsxFacadeService.displayedColumns$ as Observable<
    string[]
  >;

  displayedFailedColumns = ['failedEvents'];
  displayedFailedEvents$ = this.xlsxFacadeService.displayedFailedEvents$;
  hasProcessedFailedEvents$ = this.displayedFailedEvents$.pipe(
    map((events) => events.length > 0)
  );
  private destroy$ = new Subject<void>();

  file: File | undefined;
  loading = true;
  dataColumnNameString = 'dataLayer Specs';
  form = this.fb.group({
    worksheetNames: [''],
    dataColumnName: [this.dataColumnNameString, Validators.required]
  });

  numTotalTags$ = this.xlsxFacadeService.getNumTotalEvents();
  numParsedTags$ = this.xlsxFacadeService.getNumParsedEvents();

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
    this.sidenav.toggle();
    document.body.style.overflow = this.sidenav.opened ? 'hidden' : 'auto';
  }

  private isLoading() {
    const spinningTime = 1;
    return combineLatest([
      timer(0, 500),
      this.xlsxFacadeService.workbook$,
      this.xlsxFacadeService.dataSource$,
      this.xlsxFacadeService.displayedDataSource$,
      this.xlsxFacadeService.displayedColumns$
    ]).pipe(
      takeWhile(([timer]) => timer <= spinningTime),
      tap(
        ([
          timer,
          workbook,
          dataSource,
          displayedDataSource,
          displayedColumns
        ]) => {
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
        }
      )
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
    this.xlsxFacadeService.withWorkbookHandling(
      this.workbook$,
      'switchSheet',
      name
    );
  }

  onAction(action: string) {
    const dataColumnName = this.dataColumnName?.value as string;
    this.xlsxFacadeService.onAction(action, dataColumnName);
  }

  // getters
  get dataColumnName() {
    return this.form.controls.dataColumnName;
  }
}
