import { MatCardModule } from '@angular/material/card';
import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { catchError, Subject, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectIoService } from '../../services/api/project-io/project-io.service';

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
  encapsulation: ViewEncapsulation.None,
})
export class ProjectImportComponent implements OnDestroy {
  destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private projectIoService: ProjectIoService,
    private router: Router
  ) {}

  importProject(event: Event) {
    const target = event.target as HTMLInputElement;
    const file: File | null = target.files?.[0] || null;
    if (file) {
      console.log('file', file);
      return this.projectIoService
        .importProject(file)
        .pipe(
          catchError((err) => {
            console.error(err);
            return [];
          })
        )
        .subscribe((event) => {
          // TODO: progress bar
          if (event) {
            console.log('event', event);
            if (event.type === 1) {
              this.router.navigate(['/']).then(() => {
                window.location.reload();
              });
            }
          }
        });
    }
    return new Subscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
