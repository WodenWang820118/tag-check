import {
  Component,
  DestroyRef,
  OnInit,
  signal,
  ViewEncapsulation
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, switchMap, tap } from 'rxjs';
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
import { SettingsService } from '../../services/api/settings/settings.service';
import { ActivatedRoute } from '@angular/router';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-browser-form',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    MatCheckboxModule
  ],
  templateUrl: `./browser-form.component.html`,
  styleUrls: ['./browser-form.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BrowserFormComponent implements OnInit {
  browserSettingsForm = this.fb.group({
    headless: [false],
    settings: this.fb.array([])
  });

  browserSettings = signal<string[]>([]);

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private route: ActivatedRoute,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    this.route.data
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((data) => {
          const settings = data['projectInfo'].settings;
          if (settings) {
            this.browserSettings.set(settings.browser);
            this.browserSettingsForm.controls['headless'].setValue(
              settings.headless
            );
            this.loadInitialData();
          }
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
          value
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
    return this.browserSettings();
  }

  addBrowserSetting() {
    this.browserSettingsFormFormArray.push(this.createSettingFormGroup(''));
  }

  removeBrowserSetting(index: number) {
    this.browserSettingsFormFormArray.removeAt(index);
  }

  createSettingFormGroup(value: string): FormGroup {
    return this.fb.group({
      value: [value]
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
        takeUntilDestroyed(this.destroyRef),
        switchMap((params) => {
          const projectSlug = params['projectSlug'];
          return this.settingsService.updateSettings(projectSlug, 'browser', {
            headless,
            browser
          });
        }),
        catchError((error) => {
          console.error('Error: ', error);
          return error;
        })
      )
      .subscribe();
  }
}
