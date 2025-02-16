import { Component, computed, effect, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { EditorComponent } from '../../../../shared/components/editor/editor.component';
import { UploadCardFacadeService } from './upload-card-facade.service';

@Component({
  selector: 'app-upload-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, EditorComponent],
  templateUrl: './upload-card.component.html'
})
export class UploadCardComponent implements OnInit {
  importedSpec = computed(() => this.uploadCardFacadeService.importedSpec());
  projectSlug = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private uploadCardFacadeService: UploadCardFacadeService
  ) {
    effect(() => {
      if (this.uploadCardFacadeService.isUploaded()) {
        console.log('Upload complete');
      }
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const projectSlug = params['projectSlug'];
      console.log('projectSlug: ', projectSlug);
      if (projectSlug) {
        this.projectSlug.set(projectSlug);
      }
    });
  }

  onFileSelected(event: any) {
    this.uploadCardFacadeService.onFileSelected(event);
  }

  emitUploadComplete() {
    this.uploadCardFacadeService.completeUpload();
  }

  save(projectSlug: string) {
    this.uploadCardFacadeService.save(projectSlug);
  }
}
