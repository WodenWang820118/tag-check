import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Component,
  effect,
  viewChild,
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
  // Convert viewChild to signal-based query
  importedSidenav = viewChild.required<MatSidenav>('importSidenav');

  // Convert loading to signal
  loading = signal(true);

  // Computed signal for sidenav state
  sidenavOpen = computed(() => {
    if (this.uploadSpecService.isUploaded()) {
      return false;
    }
    return this.uploadSpecService.isOpenImportSidenav();
  });

  constructor(public uploadSpecService: UploadSpecService) {
    // Effect for handling sidenav state changes
    effect(() => {
      const shouldOpen = this.sidenavOpen();
      this.importedSidenav()?.toggle(shouldOpen);

      // Update body overflow based on sidenav state
      if (this.importedSidenav()) {
        document.body.style.overflow = this.importedSidenav().opened
          ? 'hidden'
          : 'auto';
      }
    });
  }

  // UI event handler
  toggleSidenav() {
    const sidenav = this.importedSidenav();
    if (sidenav) {
      sidenav.toggle();
      document.body.style.overflow = sidenav.opened ? 'hidden' : 'auto';
    }
  }
}
