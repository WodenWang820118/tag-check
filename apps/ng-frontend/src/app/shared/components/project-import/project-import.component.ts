import { MatCardModule } from '@angular/material/card';
import {
  Component,
  ViewEncapsulation,
  DestroyRef,
  ChangeDetectionStrategy,
  inject,
  signal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectIoService } from '../../services/api/project-io/project-io.service';

/** Imports a project from an exported file, showing the upload progress. */
@Component({
  selector: 'app-project-import',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatProgressBarModule],
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>Already got the project?</mat-card-title>
      </mat-card-header>
      @if (uploading()) {
        <mat-card-content style="padding-top: 0.5rem">
          <div style="display: flex; align-items: center; gap: 0.75rem">
            <mat-progress-bar
              mode="determinate"
              [value]="uploadProgress()"
              aria-label="Upload progress"
            ></mat-progress-bar>
            <span style="min-width: 3ch; text-align: right"
              >{{ uploadProgress() }}%</span
            >
          </div>
        </mat-card-content>
      }
      <input hidden (change)="importProject($event)" #fileInput type="file" />
      <mat-card-actions align="end" style="gap: 1rem">
        <button
          mat-raised-button
          (click)="fileInput.click()"
          [disabled]="uploading()"
        >
          Upload
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None
})
export class ProjectImportComponent {
  private readonly projectIoService = inject(ProjectIoService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);

  readonly uploading = signal(false);
  readonly uploadProgress = signal(0);

  /**
   * Uploads the chosen export and opens the projects list once the import
   * response arrives. Upload progress reaches 100% before the server has
   * imported anything, so it never triggers the navigation.
   */
  importProject(event: Event) {
    const target = event.target as HTMLInputElement;
    const file: File | null = target.files?.[0] || null;
    if (!file) return;
    // Let the same file be chosen again after a failed import.
    target.value = '';

    this.uploading.set(true);
    this.uploadProgress.set(0);

    this.projectIoService
      .importProject(file)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.uploading.set(false);
        })
      )
      .subscribe({
        next: (httpEvent) => {
          if (httpEvent.type === HttpEventType.UploadProgress) {
            this.uploadProgress.set(
              Math.round((100 * httpEvent.loaded) / (httpEvent.total || 1))
            );
          }
          if (httpEvent.type === HttpEventType.Response) {
            this.uploadProgress.set(100);
            void this.router.navigate(['./']);
          }
        },
        // ProjectIoService has logged the error.
        error: () => {
          this.snackBar.open(
            'Could not import the project. Choose a project export (.zip) and try again.',
            'Dismiss',
            { duration: 5000 }
          );
        }
      });
  }
}
