import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewEncapsulation, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { catchError, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { SettingsService } from '../../services/api/settings/settings.service';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Setting } from '@utils';
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
    MatTooltipModule,
  ],
  templateUrl: './gtm-form.component.html',
  styleUrls: ['./gtm-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class GtmFormComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  previewModeForm = this.fb.group({
    url: [''],
    tagManagerUrl: [''],
    isAccompanyMode: [false],
    isRequestCheck: new FormControl({ value: false, disabled: true }),
  });

  constructor(
    private settingsService: SettingsService,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.route.parent?.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const projectSlug = params['projectSlug'];
          return this.settingsService.getProjectSettings(projectSlug);
        }),
        tap((project) => {
          const previewModeUrl = project.settings.gtm['gtmPreviewModeUrl'];
          const isAccompanyMode = project.settings.gtm['isAccompanyMode'];
          const tagManagerUrl = project.settings.gtm['tagManagerUrl'];
          const qaRequestCheck = project.settings.gtm['isRequestCheck'];
          const measumentId = project.settings['measurementId'];

          this.previewModeForm.patchValue({
            url: previewModeUrl,
            isAccompanyMode: isAccompanyMode,
            isRequestCheck: qaRequestCheck,
            tagManagerUrl: tagManagerUrl,
          });

          if (measumentId) {
            this.previewModeForm.controls['isRequestCheck'].enable();
          } else {
            this.previewModeForm.controls['isRequestCheck'].disable();
            this.previewModeForm.controls['isRequestCheck'].setValue(false);
          }
        })
      )
      .subscribe();
  }

  get urlFormControl() {
    return this.previewModeForm.get('url') as FormControl;
  }

  get urlValue() {
    return this.urlFormControl.value;
  }

  onReset() {
    this.previewModeForm.controls['url'].reset();
  }

  onSubmit() {
    this.route.parent?.params
      .pipe(
        take(1),
        switchMap((params) => {
          const projectSlug = params['projectSlug'];
          console.log(this.previewModeForm.value);
          const settings: Partial<Setting> = {
            gtm: {
              gtmPreviewModeUrl: this.previewModeForm.value.url as string,
              isAccompanyMode: this.previewModeForm.value
                .isAccompanyMode as boolean,
              isRequestCheck: this.previewModeForm.value
                .isRequestCheck as boolean,
              tagManagerUrl: this.previewModeForm.value.tagManagerUrl as string,
            },
          };
          return this.settingsService.updateSettings(
            projectSlug,
            'gtm',
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
