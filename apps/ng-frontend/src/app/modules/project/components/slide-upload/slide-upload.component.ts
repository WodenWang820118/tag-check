import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AfterViewInit,
  Component,
  effect,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { Subject } from 'rxjs';
import { ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProgressSpinnerComponent, CustomMatTableComponent } from '@ui';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { NewReportViewComponent } from '../new-report-view/new-report-view.component';
import { MatButtonModule } from '@angular/material/button';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';

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
    MatButtonModule,
  ],
  templateUrl: `./slide-upload.component.html`,
  styleUrls: ['./slide-upload.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SlideUploadComponent implements AfterViewInit, OnDestroy {
  sidenav = viewChild.required<MatSidenav>('sidenav');

  private destroy$ = new Subject<void>();

  loading = true;

  constructor(public uploadSpecService: UploadSpecService) {
    effect(() => {
      if (this.uploadSpecService.isUploaded()) {
        this.sidenav().toggle(false);
      } else if (this.uploadSpecService.isStarted()) {
        this.sidenav().toggle(true);
      }
    });
  }

  ngAfterViewInit() {
    this.sidenav().toggle(false);
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
    this.sidenav().toggle();
    document.body.style.overflow = this.sidenav()?.opened ? 'hidden' : 'auto';
  }

  emitOpenImportSidenav() {
    this.uploadSpecService.openImportSidenav();
  }
}
