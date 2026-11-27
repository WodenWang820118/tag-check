import {
  Component,
  computed,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { UploadCardFacadeService } from './upload-card-facade.service';

/** The "Import GTM JSON" tab; UploadCardFacadeService does the import. */
@Component({
  selector: 'app-upload-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './upload-card.component.html'
})
export class UploadCardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly uploadCardFacadeService = inject(UploadCardFacadeService);
  private readonly projectSlug = toSignal(
    this.route.params.pipe(map((params) => params['projectSlug'] ?? '')),
    {
      initialValue: this.route.snapshot?.params?.['projectSlug'] ?? ''
    }
  );
  private readonly state = this.uploadCardFacadeService.state;

  readonly uploadingFileName = computed(() => {
    const state = this.state();
    return state.status === 'uploading' ? state.fileName : null;
  });
  readonly summary = computed(() => {
    const state = this.state();
    return state.status === 'done' ? state.summary : null;
  });
  readonly errorMessage = computed(() => {
    const state = this.state();
    return state.status === 'error' ? state.message : null;
  });

  onFileSelected(event: Event) {
    void this.uploadCardFacadeService.onFileSelected(this.projectSlug(), event);
  }
}
