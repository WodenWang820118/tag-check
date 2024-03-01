import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, tap } from 'rxjs';
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
import { ConfigurationService } from '../../services/api/configuration/configuration.service';
import { MatBadgeModule } from '@angular/material/badge';
import { Application } from '../../models/setting.interface';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [
    CommonModule,
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
export class ApplicationFormComponent implements AfterViewInit, OnDestroy {
  destroy$ = new Subject<void>();

  applicationForm = this.fb.group({
    localStorage: this.fb.array([] as Application[]),
    cookie: this.fb.array([] as Application[]),
  });

  hideBadge = true;

  constructor(
    private fb: FormBuilder,
    private configurationService: ConfigurationService // Assuming you're using this service somewhere
  ) {
    this.loadInitialData(); // Load initial data when component is initialized
  }

  ngAfterViewInit(): void {
    const badge = document.querySelector('.mat-badge-content');
    if (badge) {
      (badge as HTMLElement).style.pointerEvents = 'inherit';
      (badge as HTMLElement).style.cursor = 'pointer';
      (badge as HTMLElement).addEventListener('click', () => {
        console.log('Badge clicked');
      });
    }
  }

  get localStorageFormArray() {
    return this.applicationForm.get('localStorage') as FormArray;
  }

  get cookieFormArray() {
    return this.applicationForm.get('cookie') as FormArray;
  }

  onReset() {
    console.log('Reset');
    this.applicationForm.reset();
  }

  onFormSubmit() {
    console.log('Submit', this.applicationForm.value);
  }

  addLocalStorageSetting() {
    this.localStorageFormArray.push(this.createSettingFormGroup('', ''));
  }

  loadInitialData() {
    const allSettings = this.getAllSettingsFromLocalStorage();
    const allCookies = this.getAllSettingsFromCookies();
    allSettings.forEach((setting) => {
      this.localStorageFormArray.push(
        this.createSettingFormGroup(setting.key, setting.value)
      );
    });

    allCookies.forEach((setting) => {
      this.cookieFormArray.push(
        this.createSettingFormGroup(setting.key, setting.value)
      );
    });
  }

  createSettingFormGroup(key: string, value: string): FormGroup {
    return this.fb.group({
      key: [key],
      value: [value],
    });
  }

  getAllSettingsFromCookies(): Application[] {
    // Mock implementation. Replace with actual logic to fetch from cookies.
    return [
      { key: 'cookie', value: 'true' },
      { key: 'cookieData', value: 'value' },
      // Add more if needed
    ];
  }

  getAllSettingsFromLocalStorage(): Application[] {
    // Mock implementation. Replace with actual logic to fetch from localStorage.
    return [
      { key: 'consent', value: 'true' },
      { key: 'data', value: 'value' },
      // Add more if needed
    ];
  }

  removeLocalStorageSetting(index: number) {
    this.localStorageFormArray.removeAt(index);
  }

  removeCookieSetting(index: number) {
    this.cookieFormArray.removeAt(index);
  }

  toggleBadgeVisibility(state: boolean) {
    this.hideBadge = state;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
