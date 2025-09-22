import { MatCardModule } from '@angular/material/card';
import { Component, ViewEncapsulation, DestroyRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { catchError, EMPTY, finalize, shareReplay, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ProjectIoService } from '../../services/api/project-io/project-io.service';
import { HttpEventType } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-project-import',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatProgressBarModule],
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>Already got the project?</mat-card-title>
      </mat-card-header>
      @if (uploading) {
        <mat-card-content style="padding-top: 0.5rem">
          <div style="display: flex; align-items: center; gap: 0.75rem">
            <mat-progress-bar
              mode="determinate"
              [value]="uploadProgress"
              aria-label="Upload progress"
            ></mat-progress-bar>
            <span style="min-width: 3ch; text-align: right"
              >{{ uploadProgress }}%</span
            >
          </div>
        </mat-card-content>
      }
      <input hidden (change)="importProject($event)" #fileInput type="file" />
      <mat-card-actions align="end" style="gap: 1rem">
        <button
          mat-raised-button
          (click)="fileInput.click()"
          [disabled]="uploading"
        >
          Upload
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [``],
  encapsulation: ViewEncapsulation.None
})
export class ProjectImportComponent {
  uploading = false;
  uploadProgress = 0;

  constructor(
    private readonly projectIoService: ProjectIoService,
    private readonly router: Router,
    private readonly destroyRef: DestroyRef
  ) {}

  importProject(event: Event) {
    const target = event.target as HTMLInputElement;
    const file: File | null = target.files?.[0] || null;
    if (!file) return;

    this.uploading = true;
    this.uploadProgress = 0;

    const progress$ = this.projectIoService
      .importProject(file)
      .pipe(shareReplay(1));

    progress$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = Math.round(
              (100 * event.loaded) / (event.total || 1)
            );
            this.uploadProgress = progress;
          }
          if (event.type === HttpEventType.Response) {
            this.uploadProgress = 100;
          }
        }),
        tap(async () => {
          if (this.uploadProgress === 100) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await this.router.navigate(['./']);
          }
        }),
        catchError((err) => {
          console.error(err);
          return EMPTY;
        }),
        finalize(() => {
          this.uploading = false;
        })
      )
      .subscribe();
  }
}
