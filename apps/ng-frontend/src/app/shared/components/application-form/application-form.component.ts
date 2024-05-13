import { NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, EMPTY, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { CookieData, LocalStorageData } from '@utils';
import { SettingsService } from '../../services/api/settings/settings.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [
    NgIf,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    ReactiveFormsModule,
    FormsModule,
    MatBadgeModule,
  ],
  templateUrl: './application-form.component.html',
  styleUrls: ['./application-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ApplicationFormComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();

  applicationForm = this.fb.group({
    localStorage: this.fb.array([] as LocalStorageData[]),
    cookie: this.fb.array([] as CookieData[]),
  });

  localStorageSettings: LocalStorageData[] = [];
  cookieSettings: CookieData[] = [];

  isEmptyLocalStorage = false;
  isEmptyCookie = false;

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
          this.localStorageSettings =
            project.settings.application.localStorage.data;
          this.cookieSettings = project.settings.application.cookie.data;
          this.loadInitialData();
        }),
        catchError((err) => {
          console.error(err);
          return EMPTY;
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
        value: this.localStorageFormArray.controls[key as any].value,
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
        value: this.cookieFormArray.controls[key as any].value,
      };
    });
  }

  observeLocalStorageFormArray() {
    return this.localStorageFormArray.valueChanges.pipe(
      takeUntil(this.destroy$),
      tap((value) => {
        this.isEmptyLocalStorage = value.some(
          (setting: LocalStorageData) => !setting.key || !setting.value
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
      takeUntil(this.destroy$),
      tap((value) => {
        this.isEmptyCookie = value.some(
          (setting: CookieData) => !setting.key || !setting.value
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
        takeUntil(this.destroy$),
        switchMap((params) => {
          const projectSlug = params['projectSlug'];
          if (projectSlug) {
            return this.settingsService.updateSettings(
              projectSlug,
              'application',
              this.applicationForm.value
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
      value: [value],
    });
  }

  getAllSettingsFromCookies(): CookieData[] {
    return this.cookieSettings;
  }

  getAllSettingsFromLocalStorage(): LocalStorageData[] {
    return this.localStorageSettings;
  }

  removeLocalStorageSetting(index: number) {
    this.localStorageFormArray.removeAt(index);
  }

  removeCookieSetting(index: number) {
    this.cookieFormArray.removeAt(index);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
