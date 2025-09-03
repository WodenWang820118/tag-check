import { Component, effect, signal, viewChild } from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { NewReportViewComponent } from '../new-report-view/new-report-view.component';
import { UploadCardComponent } from '../upload-card/upload-card.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';

@Component({
  selector: 'app-slide-upload',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatIconModule,
    NewReportViewComponent,
    MatButtonModule,
    UploadCardComponent,
    MatTabsModule
  ],
  templateUrl: './slide-upload.component.html',
  styleUrls: ['./slide-upload.component.scss']
})
export class SlideUploadComponent {
  sidenav = viewChild.required<MatSidenav>('sidenav');
  loading = signal(true);

  constructor(public uploadSpecService: UploadSpecService) {
    effect(() => {
      if (this.uploadSpecService.isStarted()) {
        this.sidenav().toggle(true);
      } else {
        this.sidenav().toggle(false);
      }
    });
  }

  toggleSidenav() {
    this.adjustBodyOverflow();
  }

  private adjustBodyOverflow() {
    const sidenavInstance = this.sidenav();
    if (sidenavInstance) {
      sidenavInstance.toggle();
      document.body.style.overflow = sidenavInstance.opened ? 'hidden' : 'auto';
    }
  }

  emitOpenImportSidenav() {
    this.uploadSpecService.openImportSidenav();
  }
}
