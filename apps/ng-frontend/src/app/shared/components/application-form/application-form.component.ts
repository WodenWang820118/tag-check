import {
  Component,
  DestroyRef,
  OnInit,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, EMPTY, switchMap, take, tap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { ApplicationSetting, CookieData, LocalStorageData } from '@utils';
import { SettingsService } from '../../services/api/settings/settings.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * The text a settings field shows for a stored value. Strings are shown as
 * they are: encoding them as JSON added quotes that a save then stored, so
 * the site read `"true"` instead of `true`. Older settings may hold objects,
 * which are shown as JSON.
 */
export function toEditableValue(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Settings > Pre-loading values: the localStorage items and cookies set
 * on the site before each run.
 */
@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    ReactiveFormsModule,
    FormsModule,
    MatBadgeModule
  ],
  templateUrl: './application-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./application-form.component.scss']
})
export class ApplicationFormComponent implements OnInit {
  applicationForm = this.fb.group({
    localStorage: this.fb.array([] as LocalStorageData[]),
    cookie: this.fb.array([] as CookieData[]),
    websiteUrl: this.fb.control<string>('')
  });

  localStorageSettings = signal<LocalStorageData[]>([]);
  cookieSettings = signal<CookieData[]>([]);
  isEmptyLocalStorage = signal(false);
  isEmptyCookie = signal(false);

  constructor(
    private readonly fb: FormBuilder,
    private readonly settingsService: SettingsService,
    private readonly route: ActivatedRoute,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.route.data
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((data) => {
          const settings = data['projectInfo'].applicationSettings;
          if (settings) {
            this.localStorageSettings.set(
              settings.localStorage.data as LocalStorageData[]
            );
            this.cookieSettings.set(settings.cookie.data as CookieData[]);
            this.applicationForm.patchValue({
              localStorage: this.localStorageSettings(),
              cookie: this.cookieSettings(),
              websiteUrl: settings.websiteUrl || ''
            });
            this.loadInitialData();
          } else {
            throw new Error('Application settings not found');
          }
        })
      )
      .subscribe();

    this.observeLocalStorageFormArray().subscribe();
    this.observeCookieFormArray().subscribe();
  }

  get localStorageFormArray() {
    return this.applicationForm.get('localStorage') as FormArray;
  }

  get localStorageFormArrayValue() {
    return this.localStorageFormArray.controls.map((control, index) => ({
      key: String(index),
      value: control.value
    }));
  }

  get cookieFormArray() {
    return this.applicationForm.get('cookie') as FormArray;
  }

  get cookieFormArrayValue() {
    return this.cookieFormArray.controls.map((control, index) => ({
      key: String(index),
      value: control.value
    }));
  }

  observeLocalStorageFormArray() {
    return this.localStorageFormArray.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((value) => {
        this.isEmptyLocalStorage.set(
          value.some(
            (setting: LocalStorageData) => !setting.key || !setting.value
          )
        );
      })
    );
  }

  observeCookieFormArray() {
    return this.cookieFormArray.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((value) => {
        this.isEmptyCookie.set(
          value.some((setting: CookieData) => !setting.key || !setting.value)
        );
      })
    );
  }

  onFormSubmit() {
    this.route.parent?.params
      .pipe(
        take(1),
        switchMap((params) => {
          const projectSlug = params['projectSlug'];
          if (projectSlug) {
            const settings: Partial<ApplicationSetting> = {
              websiteUrl: this.applicationForm.controls.websiteUrl.value ?? '',
              localStorage: {
                data: this.localStorageFormArrayValue.map((item) => ({
                  key: item.value.key,
                  value: item.value.value
                }))
              },
              cookie: {
                data: this.cookieFormArrayValue.map((item) => ({
                  key: item.value.key,
                  value: item.value.value
                }))
              }
            };

            return this.settingsService.updateApplicationSetting(
              projectSlug,
              settings
            );
          }
          return EMPTY;
        }),
        // SettingsService has shown the failure in a snackbar.
        catchError((error: unknown) => {
          console.error('Error: ', error);
          return EMPTY;
        })
      )
      .subscribe();
  }

  addLocalStorageSetting() {
    this.localStorageFormArray.push(this.createSettingFormGroup('', ''));
  }

  addCookieSetting() {
    this.cookieFormArray.push(this.createSettingFormGroup('', ''));
  }

  loadInitialData() {
    const allSettings = this.getAllSettingsFromLocalStorage();
    const allCookies = this.getAllSettingsFromCookies();
    for (const setting of allSettings) {
      this.localStorageFormArray.push(
        this.createSettingFormGroup(setting.key, toEditableValue(setting.value))
      );
    }

    for (const setting of allCookies) {
      this.cookieFormArray.push(
        this.createSettingFormGroup(setting.key, toEditableValue(setting.value))
      );
    }
  }

  createSettingFormGroup(key: string, value: string): FormGroup {
    return this.fb.group({
      key: [key],
      value: [value]
    });
  }

  getAllSettingsFromCookies(): CookieData[] {
    return this.cookieSettings();
  }

  getAllSettingsFromLocalStorage(): LocalStorageData[] {
    return this.localStorageSettings();
  }

  removeLocalStorageSetting(index: number) {
    this.localStorageFormArray.removeAt(index);
  }

  removeCookieSetting(index: number) {
    this.cookieFormArray.removeAt(index);
  }
}
