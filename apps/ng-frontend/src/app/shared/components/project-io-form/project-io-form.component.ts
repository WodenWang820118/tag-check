import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EMPTY, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { SettingsService } from '../../services/api/settings/settings.service';
import { ActivatedRoute } from '@angular/router';
import { ProjectIoService } from '../../services/api/project-io/project-io.service';

@Component({
  selector: 'app-project-io-form',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    ReactiveFormsModule,
    FormsModule,
    MatSelectModule,
    MatOptionModule,
  ],
  templateUrl: './project-io-form.component.html',
  styleUrls: ['./project-io-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ProjectIoFormComponent implements OnDestroy {
  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
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
