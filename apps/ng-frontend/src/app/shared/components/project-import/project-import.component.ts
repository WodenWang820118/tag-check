import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { EMPTY, Subject, switchMap, take } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ProjectIoService } from '../../services/api/project-io/project-io.service';

@Component({
  selector: 'app-project-io-form',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <button mat-raised-button (click)="fileInput.click()">Upload</button>
    <input hidden (change)="importProject($event)" #fileInput type="file" />
  `,
  styles: [``],
  encapsulation: ViewEncapsulation.None,
})
export class ProjectImportComponent implements OnDestroy {
  destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private projectIoService: ProjectIoService
  ) {}

  importProject(event: Event) {
    this.route.parent?.params
      .pipe(
        take(1),
        switchMap((params) => {
          const projectSlug = params['projectSlug'];
          const target = event.target as HTMLInputElement;
          const file: File | null = target.files?.[0] || null;

          if (projectSlug && file) {
            console.log('file', file);
            return this.projectIoService.importProject(file);
          }
          return EMPTY;
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
