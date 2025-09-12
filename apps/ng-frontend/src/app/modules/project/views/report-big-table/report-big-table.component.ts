import { Component, OnDestroy, effect, signal, viewChild } from '@angular/core';
import { ReportTableComponent } from '../../components/report-table/report-table.component';
import { ReportTableToolbarComponent } from '../../components/report-table-toolbar/report-table-toolbar.component';
import { SlideUploadComponent } from '../../components/slide-upload/slide-upload.component';
import { SlideImportComponent } from '../../components/slide-import/slide-import.component';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
@Component({
  selector: 'app-report-big-table',
  standalone: true,
  imports: [
    ReportTableComponent,
    ReportTableToolbarComponent,
    SlideUploadComponent,
    SlideImportComponent,
    MatSidenavModule
  ],
  template: `
    <mat-sidenav-container [hasBackdrop]="true" (backdropClick)="onBackdrop()">
      <mat-sidenav
        #sheet
        class="slide-sidenav"
        position="end"
        mode="over"
        [fixedInViewport]="true"
        [fixedTopGap]="0"
        [fixedBottomGap]="0"
        [autoFocus]="true"
        (closed)="onClosed()"
        (keydown.escape)="onBackdrop()"
      >
        @if (uploadSpecService.isStarted()) {
          <app-slide-upload [sidenav]="sheet"></app-slide-upload>
        } @else if (
          !uploadSpecService.isUploaded() &&
          uploadSpecService.isOpenImportSidenav()
        ) {
          <app-slide-import-sidenav
            [importedSidenav]="sheet"
          ></app-slide-import-sidenav>
        }
      </mat-sidenav>

      <mat-sidenav-content>
        <div class="report-view mat-elevation-z4">
          <app-report-table-toolbar></app-report-table-toolbar>
          <app-report-table></app-report-table>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      :host mat-sidenav-container {
        height: 100vh;
        display: block;
      }

      .report-view {
        margin: 5rem 12rem;
      }

      .preview-mode-input {
        margin: 1rem;
        padding-bottom: 1rem;
      }
    `
  ]
})
export class ReportBigTableComponent implements OnDestroy {
  sheet = viewChild.required<MatSidenav>('sheet');
  private readonly isClosing = signal(false);

  constructor(public readonly uploadSpecService: UploadSpecService) {
    // Open/close the single sidenav based on which panel should show
    effect(() => {
      const showUpload = this.uploadSpecService.isStarted();
      const showImport =
        !this.uploadSpecService.isUploaded() &&
        this.uploadSpecService.isOpenImportSidenav();
      const sn = this.sheet();
      if (this.isClosing()) {
        sn.close();
        document.body.style.overflow = 'auto';
        return;
      }
      if (showUpload || showImport) {
        sn.open();
        document.body.style.overflow = 'hidden';
      } else {
        sn.close();
        document.body.style.overflow = 'auto';
      }
    });
  }

  onBackdrop() {
    this.isClosing.set(true);
    this.sheet()?.close();
  }

  onClosed() {
    // After animation completes, clear state and allow effect to settle
    this.uploadSpecService.resetStart();
    this.uploadSpecService.resetImport();
    document.body.style.overflow = 'auto';
    this.isClosing.set(false);
  }

  ngOnDestroy(): void {
    // resetting the upload state
    this.uploadSpecService.completeUpload();
  }
}
