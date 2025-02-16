import { Component, DestroyRef, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
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
  styleUrls: ['./application-form.component.scss']
})
export class ApplicationFormComponent implements OnInit {
  applicationForm = this.fb.group({
    localStorage: this.fb.array([] as LocalStorageData[]),
    cookie: this.fb.array([] as CookieData[])
  });

  localStorageSettings = signal<LocalStorageData[]>([]);
  cookieSettings = signal<CookieData[]>([]);
  isEmptyLocalStorage = signal(false);
  isEmptyCookie = signal(false);

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private route: ActivatedRoute,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.route.data
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((data) => {
          const settings = data['projectInfo'].settings;
          if (settings) {
            this.localStorageSettings.set(
              settings.application.localStorage.data as LocalStorageData[]
            );
            this.cookieSettings.set(
              settings.application.cookie.data as CookieData[]
            );
            this.loadInitialData();
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
    return Object.keys(this.localStorageFormArray.controls).map((key) => {
      return {
        key: key,
        value: this.localStorageFormArray.controls[key as any].value
      };
    });
  }

  get cookieFormArray() {
    return this.applicationForm.get('cookie') as FormArray;
  }

  get cookieFormArrayValue() {
    return Object.keys(this.cookieFormArray.controls).map((key) => {
      return {
        key: key,
        value: this.cookieFormArray.controls[key as any].value
      };
    });
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
      }),
      catchError((error) => {
        console.error('Error: ', error);
        return error;
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
      }),
      catchError((error) => {
        console.error('Error: ', error);
        return error;
      })
    );
  }

  onFormSubmit() {
    this.route.parent?.params
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((params) => {
          const projectSlug = params['projectSlug'];
          if (projectSlug) {
            const settings: Partial<ApplicationSetting> = {
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
        catchError((error) => {
          console.error('Error: ', error);
          return error;
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
    allSettings.forEach((setting) => {
      this.localStorageFormArray.push(
        this.createSettingFormGroup(setting.key, JSON.stringify(setting.value))
      );
    });

    allCookies.forEach((setting) => {
      this.cookieFormArray.push(
        this.createSettingFormGroup(setting.key, JSON.stringify(setting.value))
      );
    });
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
