import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { EMPTY, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';
import { ProjectIoService } from '../../services/api/project-io/project-io.service';

@Component({
  selector: 'app-project-io-form',
  standalone: true,
  imports: [MatButtonModule, MatCardModule],
  templateUrl: './project-io-form.component.html',
  styleUrls: ['./project-io-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ProjectIoFormComponent implements OnDestroy {
  destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private projectIoService: ProjectIoService
  ) {}

  exportProject() {
    this.route.parent?.params
      .pipe(
        takeUntil(this.destroy$),
        tap((params) => {
          const projectSlug = params['projectSlug'];
          if (projectSlug) {
            this.projectIoService.exportProject(projectSlug);
          }
          return EMPTY;
        })
      )
      .subscribe();
  }

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
