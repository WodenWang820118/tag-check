import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import {
  Observable,
  Subject,
} from 'rxjs';
import { ViewEncapsulation } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ProgressSpinnerComponent, CustomMatTableComponent } from '@ui';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { NewReportViewComponent } from "../new-report-view/new-report-view.component";
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-slide-sidenav',
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
    CustomMatTableComponent,
    NewReportViewComponent,
    MatButtonModule
  ],
  templateUrl: `./slide-upload.component.html`,
  styleUrls: ['./slide-upload.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SlideUploadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sidenav') sidenav: MatSidenav | undefined;
  @Input() isOpened = false;
  @Output() openImportSidenav = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  loading = true;

  constructor(
  ) { }

  ngAfterViewInit() {
    if (!this.sidenav) return;
    this.sidenav.toggle(this.isOpened);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // UI event handlers
  toggleSidenav() {
    this.adjustBodyOverflow();
  }

  private adjustBodyOverflow() {
    if (!this.sidenav) return;
    this.sidenav.toggle();
    document.body.style.overflow = this.sidenav.opened ? 'hidden' : 'auto';
  }

  emitOpenImportSidenav() {
    this.openImportSidenav.emit();
  }

}
