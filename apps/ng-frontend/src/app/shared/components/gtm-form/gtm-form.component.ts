import { CommonModule } from '@angular/common';
import { Component, OnInit, DestroyRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { catchError, switchMap, take, tap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { SettingsService } from '../../services/api/settings/settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApplicationSetting, ProjectSetting } from '@utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({
  selector: 'app-gtm-form',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatTooltipModule
  ],
  templateUrl: './gtm-form.component.html',
  styleUrls: ['./gtm-form.component.scss']
})
export class GtmFormComponent implements OnInit {
  previewModeForm: FormGroup<{
    gtmPreviewModeUrl: FormControl<string | null>;
    tagManagerUrl: FormControl<string | null>;
    isAccompanyMode: FormControl<boolean | null>;
    isRequestCheck: FormControl<boolean | null>;
  }> = this.fb.group({
    gtmPreviewModeUrl: [''],
    tagManagerUrl: [''],
    isAccompanyMode: [false],
    isRequestCheck: new FormControl({ value: false, disabled: true })
  });

  constructor(
    private readonly settingsService: SettingsService,
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly destroyRef: DestroyRef,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.route.data
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((data) => {
          const settings: ProjectSetting = data[
            'projectInfo'
          ] as ProjectSetting;
          console.log('settings', settings);
          if (settings) {
            this.previewModeForm.patchValue(settings.applicationSettings.gtm);
            if (settings.measurementId) {
              this.previewModeForm.controls.isRequestCheck.enable();
            } else {
              this.previewModeForm.controls.isRequestCheck.disable();
              this.previewModeForm.controls.isRequestCheck.setValue(false);
            }
          }
        })
      )
      .subscribe();

    // keep accompanied mode disabled until a Preview Mode URL is provided
    this.previewModeForm.controls.gtmPreviewModeUrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        const hasUrl = !!val && String(val).trim().length > 0;
        if (hasUrl) {
          this.previewModeForm.controls.isAccompanyMode.enable();
        } else {
          this.previewModeForm.controls.isAccompanyMode.setValue(false);
          this.previewModeForm.controls.isAccompanyMode.disable();
        }
      });
  }

  get requestCheckTooltip(): string {
    return (
      'Request check validates network requests against the Measurement ID set in Project Information. ' +
      'Provide a Measurement ID in project settings to use this mode.'
    );
  }

  goToProjectInfo() {
    // Navigate to the project info settings route
    this.router.navigate(['../project-info'], {
      relativeTo: this.route
    });
  }

  onReset() {
    this.previewModeForm.controls.gtmPreviewModeUrl.reset();
  }

  onSubmit() {
    this.route.parent?.params
      .pipe(
        take(1),
        switchMap((params) => {
          const projectSlug = params['projectSlug'];
          console.log(this.previewModeForm.value);
          const settings: Partial<ApplicationSetting> = {
            gtm: {
              gtmPreviewModeUrl:
                this.previewModeForm.value.gtmPreviewModeUrl || '',
              isAccompanyMode:
                this.previewModeForm.value.isAccompanyMode || false,
              isRequestCheck:
                this.previewModeForm.value.isRequestCheck || false,
              tagManagerUrl: this.previewModeForm.value.tagManagerUrl || ''
            }
          };
          return this.settingsService.updateApplicationSetting(
            projectSlug,
            settings
          );
        }),
        catchError((err) => {
          console.error(err);
          return [];
        })
      )
      .subscribe();
  }
}
