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
import { UploadCardComponent } from '../upload-card/upload-card.component';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';

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
    UploadCardComponent,
  ],
  templateUrl: `./slide-import.component.html`,
  styleUrls: ['./slide-import.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SlideImportComponent implements AfterViewInit, OnDestroy {
  importedSidenav = viewChild.required<MatSidenav>('importSidenav');
  private destroy$ = new Subject<void>();

  loading = true;
  constructor(public uploadSpecService: UploadSpecService) {
    effect(() => {
      if (this.uploadSpecService.isUploaded()) {
        this.importedSidenav().toggle(false);
      } else if (this.uploadSpecService.isOpenImportSidenav()) {
        this.importedSidenav().toggle(true);
      }
    });
  }

  ngAfterViewInit() {
    this.importedSidenav().toggle(false);
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
    this.importedSidenav().toggle();
    document.body.style.overflow = this.importedSidenav().opened
      ? 'hidden'
      : 'auto';
  }
}
