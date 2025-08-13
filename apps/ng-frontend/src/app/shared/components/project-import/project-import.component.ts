import { MatCardModule } from '@angular/material/card';
import { Component, ViewEncapsulation, DestroyRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { catchError, EMPTY, map, shareReplay, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ProjectIoService } from '../../services/api/project-io/project-io.service';
import { HttpEventType } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-project-import',
  standalone: true,
  imports: [MatCardModule, MatButtonModule],
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>Already got the project?</mat-card-title>
      </mat-card-header>
      <input hidden (change)="importProject($event)" #fileInput type="file" />
      <mat-card-actions align="end" style="gap: 1rem">
        <button mat-raised-button (click)="fileInput.click()">Upload</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [``],
  encapsulation: ViewEncapsulation.None
})
export class ProjectImportComponent {
  constructor(
    private readonly projectIoService: ProjectIoService,
    private readonly router: Router,
    private readonly destroyRef: DestroyRef
  ) {}

  importProject(event: Event) {
    const target = event.target as HTMLInputElement;
    const file: File | null = target.files?.[0] || null;
    const progress$ = this.projectIoService
      .importProject(file)
      .pipe(shareReplay(1));

    progress$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = Math.round(
              (100 * event.loaded) / (event.total || 1)
            );
            console.log(`Event Type: ${event.type}`);
            console.log(`Upload progress: ${progress}%`);
            // TODO: Update progress bar here
            return progress;
          }
          return EMPTY;
        }),
        tap(async (progress) => {
          if (progress && progress === 100) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            console.log('Progress:', progress);
            await this.router.navigate(['./']);
          }
        }),
        catchError((err) => {
          console.error(err);
          return EMPTY;
        })
      )
      .subscribe();
  }
}
