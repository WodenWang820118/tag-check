import { NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, Subject, switchMap, takeUntil, tap } from 'rxjs';
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
import { SettingsService } from '../../services/api/settings/settings.service';
import { ActivatedRoute } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-browser-form',
  standalone: true,
  imports: [
    NgIf,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    MatCheckboxModule,
  ],
  templateUrl: `./browser-form.component.html`,
  styleUrls: ['./browser-form.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BrowserFormComponent implements OnInit, OnDestroy {
  browserSettingsForm = this.fb.group({
    headless: [false],
    settings: this.fb.array([]),
  });

  browserSettings: string[] = [];
  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private route: ActivatedRoute
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
          this.browserSettings = project.settings.browser;
          this.browserSettingsForm.controls['headless'].setValue(
            project.settings.headless
          );
          this.loadInitialData();
        }),
        catchError((err) => {
          console.error(err);
          return [];
        })
      )
      .subscribe();
  }

  get browserSettingsFormFormArray() {
    return this.browserSettingsForm.get('settings') as FormArray;
  }

  get localStorageFormArrayValue() {
    return Object.keys(this.browserSettingsFormFormArray.controls).map(
      (value) => {
        return {
          value,
        };
      }
    );
  }

  loadInitialData() {
    const allSettings = this.getAllBrowserSettings();
    allSettings.forEach((value) => {
      this.browserSettingsFormFormArray.push(
        this.createSettingFormGroup(value)
      );
    });
  }

  getAllBrowserSettings(): string[] {
    return this.browserSettings;
  }

  addBrowserSetting() {
    this.browserSettingsFormFormArray.push(this.createSettingFormGroup(''));
  }

  removeBrowserSetting(index: number) {
    this.browserSettingsFormFormArray.removeAt(index);
  }

  createSettingFormGroup(value: string): FormGroup {
    return this.fb.group({
      value: [value],
    });
  }

  onFormSubmit() {
    const settingsArray = this.browserSettingsFormFormArray.value as {
      value: string;
    }[];
    const headless = this.browserSettingsForm.get('headless')?.value as boolean;
    const browser = settingsArray.map((setting) => setting.value);

    this.route.parent?.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const projectSlug = params['projectSlug'];
          return this.settingsService.updateSettings(projectSlug, 'browser', {
            headless,
            browser,
          });
        }),
        catchError((error) => {
          console.error('Error: ', error);
          return error;
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
