import { Component, signal, input } from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { NewReportViewComponent } from '../new-report-view/new-report-view.component';
import { UploadCardComponent } from '../upload-card/upload-card.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';
import { Ga4UploadComponent } from '../ga4-upload/ga4-upload.component';

@Component({
  selector: 'app-slide-upload',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatIconModule,
    NewReportViewComponent,
    MatButtonModule,
    UploadCardComponent,
    MatTabsModule,
    Ga4UploadComponent
  ],
  templateUrl: './slide-upload.component.html',
  styleUrls: ['./slide-upload.component.scss']
})
export class SlideUploadComponent {
  sidenav = input.required<MatSidenav>();
  loading = signal(true);

  constructor(public uploadSpecService: UploadSpecService) {}

  toggleSidenav() {
    const s = this.sidenav();
    if (!s) return;
    if (s.opened) {
      this.closeIfOpen();
    } else {
      this.open();
    }
  }

  open() {
    const s = this.sidenav();
    if (!s) return;
    s.open();
  }

  closeIfOpen() {
    const s = this.sidenav();
    if (!s) return;
    if (s.opened) {
      s.close();
      this.uploadSpecService.resetStart();
    }
  }

  emitOpenImportSidenav() {
    this.uploadSpecService.openImportSidenav();
  }
}
