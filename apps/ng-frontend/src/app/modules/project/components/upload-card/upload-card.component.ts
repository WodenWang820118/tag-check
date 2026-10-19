import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { UploadCardFacadeService } from './upload-card-facade.service';

@Component({
  selector: 'app-upload-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './upload-card.component.html'
})
export class UploadCardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly uploadCardFacadeService = inject(UploadCardFacadeService);
  private readonly projectSlug = signal<string>('');
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

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const projectSlug = params['projectSlug'];
      if (projectSlug) {
        this.projectSlug.set(projectSlug);
      }
    });
  }

  onFileSelected(event: Event) {
    this.uploadCardFacadeService.onFileSelected(this.projectSlug(), event);
  }
}
