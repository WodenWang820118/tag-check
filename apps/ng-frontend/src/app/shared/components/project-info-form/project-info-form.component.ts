import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { SettingsService } from '../../services/api/settings/settings.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-project-info-form',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './project-info-form.component.html',
  styleUrls: ['./project-info-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ProjectInfoFormComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();

  projectInfoForm = this.fb.group({
    projectName: [''],
    measurementId: [''],
    projectDescription: [''],
    googleSpreadsheetLink: [''],
  });

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.parent?.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const projectSlug = params['projectSlug'];
          return this.settingsService.getProjectSettings(projectSlug);
        }),
        tap((project) => {
          if (project.settings) {
            const settings = project.settings;
            this.projectInfoForm.patchValue({
              projectName: settings.projectName,
              measurementId: settings.measurementId,
              projectDescription: settings.projectDescription,
              googleSpreadsheetLink: settings.googleSpreadsheetLink,
            });
          }
        }),
        catchError((err) => {
          console.error(err);
          return [];
        })
      )
      .subscribe();
  }

  onSubmit() {
    this.route.parent?.params
      .pipe(
        take(1),
        switchMap((params) => {
          const projectSlug = params['projectSlug'];
          console.log(this.projectInfoForm.value);
          console.log(projectSlug);
          return this.settingsService.updateSettings(
            projectSlug,
            'others',
            this.projectInfoForm.value
          );
        }),
        catchError((err) => {
          console.error(err);
          return [];
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
