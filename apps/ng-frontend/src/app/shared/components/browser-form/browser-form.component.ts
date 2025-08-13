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
import { BrowserSetting, ProjectSetting } from '@utils';

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
    private readonly fb: FormBuilder,
    private readonly settingsService: SettingsService,
    private readonly route: ActivatedRoute,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit() {
    this.route.data
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((data) => {
          const settings: ProjectSetting = data['projectInfo'];
          if (settings) {
            this.browserSettings.set(settings.browserSettings.browser);
            this.browserSettingsForm.controls['headless'].setValue(
              settings.browserSettings.headless
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
    const headless = this.browserSettingsForm.controls.headless.value || false;
    const browser = settingsArray.map((setting) => setting.value);

    this.route.parent?.params
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((params) => {
          const projectSlug = params['projectSlug'];
          const browserSettings: Partial<BrowserSetting> = {
            headless,
            browser
          };
          return this.settingsService.updateBrowserSetting(
            projectSlug,
            browserSettings
          );
        }),
        catchError((error) => {
          console.error('Error: ', error);
          return error;
        })
      )
      .subscribe();
  }
}
