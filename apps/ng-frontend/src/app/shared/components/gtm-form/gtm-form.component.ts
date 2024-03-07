import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewEncapsulation, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Subject, switchMap, takeUntil, tap } from 'rxjs';
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
    gtmId: [''],
    isAccompanyMode: [false],
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
          const gtmId = project.settings.gtm['gtmId'];

          this.previewModeForm.patchValue({
            url: previewModeUrl,
            isAccompanyMode: isAccompanyMode,
            tagManagerUrl: tagManagerUrl,
            gtmId: gtmId,
          });
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
        takeUntil(this.destroy$),
        switchMap((params) => {
          const projectSlug = params['projectSlug'];
          console.log(this.previewModeForm.value);
          return this.settingsService.updateSettings(projectSlug, 'gtm', {
            gtmPreviewModeUrl: this.previewModeForm.value.url,
            isAccompanyMode: this.previewModeForm.value.isAccompanyMode,
            tagManagerUrl: this.previewModeForm.value.tagManagerUrl,
            gtmId: this.previewModeForm.value.gtmId,
          });
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
