import { CommonModule } from '@angular/common';
import {
  Component,
  ViewEncapsulation,
  OnInit,
  DestroyRef
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { catchError, switchMap, take, tap } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { SettingsService } from '../../services/api/settings/settings.service';
import { ActivatedRoute } from '@angular/router';
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
  styleUrls: ['./gtm-form.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GtmFormComponent implements OnInit {
  previewModeForm = this.fb.group({
    url: [''],
    tagManagerUrl: [''],
    isAccompanyMode: [false],
    isRequestCheck: new FormControl({ value: false, disabled: true })
  });

  constructor(
    private readonly settingsService: SettingsService,
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    this.route.data.pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((data) => {
        const settings: ProjectSetting = data['projectInfo'];
        if (settings) {
          this.previewModeForm.patchValue(settings.applicationSettings.gtm);
          if (settings.measurementId) {
            this.previewModeForm.controls['isRequestCheck'].enable();
          } else {
            this.previewModeForm.controls['isRequestCheck'].disable();
            this.previewModeForm.controls['isRequestCheck'].setValue(false);
          }
        }
      })
    );
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
          const settings: Partial<ApplicationSetting> = {
            gtm: {
              gtmPreviewModeUrl: this.previewModeForm.value.url || '',
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
