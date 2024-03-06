import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { SettingsService } from '../../services/api/settings/settings.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-project-info-form',
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
  templateUrl: './project-info-form.component.html',
  styleUrls: ['./project-info-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ProjectInfoFormComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();

  projectInfoForm = this.fb.group({
    projectName: [''],
    projectDescription: [''],
    testType: [{ value: '', disabled: true }],
    googleSpreadsheetLink: [''],
    tagManagerUrl: [''],
    gtmId: [''],
    preventNavigationEvents: this.fb.array([]),
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
              projectDescription: settings.projectDescription,
              testType: settings.testType,
              googleSpreadsheetLink: settings.googleSpreadsheetLink,
              tagManagerUrl: settings.gtm.tagManagerUrl,
              gtmId: settings.gtm.gtmId,
            });
          }
        })
      )
      .subscribe();
  }

  onSubmit() {
    // TODO: Implement onSubmit
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
