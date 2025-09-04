import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Component,
  input,
  signal,
  computed,
  ViewEncapsulation
} from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { UploadCardComponent } from '../upload-card/upload-card.component';
import { UploadSpecService } from '../../../../shared/services/upload-spec/upload-spec.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-slide-import-sidenav',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatProgressSpinnerModule,
    MatCardModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    UploadCardComponent
  ],
  templateUrl: './slide-import.component.html',
  styleUrls: ['./slide-import.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SlideImportComponent {
  // Accept sidenav via input from parent container
  importedSidenav = input.required<MatSidenav>();

  // Convert loading to signal
  loading = signal(true);

  // Computed signal for sidenav state
  sidenavOpen = computed(() => {
    if (this.uploadSpecService.isUploaded()) {
      return false;
    }
    return this.uploadSpecService.isOpenImportSidenav();
  });

  constructor(public uploadSpecService: UploadSpecService) {}

  // UI event handler
  toggleSidenav() {
    const sidenav = this.importedSidenav();
    if (sidenav) {
      sidenav.toggle();
    }
  }

  closeIfOpen() {
    const sidenav = this.importedSidenav();
    if (sidenav?.opened) {
      sidenav.close();
      this.uploadSpecService.resetImport();
    }
  }
}
