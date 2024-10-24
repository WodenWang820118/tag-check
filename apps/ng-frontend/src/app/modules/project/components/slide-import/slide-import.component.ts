import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import {
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
import { UploadCardComponent } from '../upload-card/upload-card.component';

@Component({
  selector: 'app-slide-import-sidenav',
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
    MatButtonModule,
    CustomMatTableComponent,
    NewReportViewComponent,
    UploadCardComponent
  ],
  templateUrl: `./slide-import.component.html`,
  styleUrls: ['./slide-import.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SlideImportComponent implements AfterViewInit, OnDestroy {
  @ViewChild('importSidenav') sidenav: MatSidenav | undefined;
  @Input() isOpened = false;

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
}
