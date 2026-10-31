import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { form, FormField } from '@angular/forms/signals';
import { ApplicationSetting, CookieData, LocalStorageData } from '@utils';
import { SettingsService } from '../../services/api/settings/settings.service';

/**
 * The text a settings field shows for a stored value. Strings are shown as
 * they are: encoding them as JSON added quotes that a save then stored, so
 * the site read `"true"` instead of `true`. Older settings may hold objects,
 * which are shown as JSON.
 */
export function toEditableValue(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

interface ApplicationFormModel {
  websiteUrl: string;
  localStorage: LocalStorageData[];
  cookie: CookieData[];
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
    MatBadgeModule,
    FormField
  ],
  templateUrl: './application-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./application-form.component.scss']
})
export class ApplicationFormComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly route = inject(ActivatedRoute);

  private readonly routeData = toSignal(this.route.data);

  readonly model = linkedSignal<ApplicationFormModel>(() => {
    const data = this.routeData();
    const settings = data?.['projectInfo']?.applicationSettings as
      | ApplicationSetting
      | undefined;
    if (!settings) {
      return {
        websiteUrl: '',
        localStorage: [],
        cookie: []
      };
    }
    return {
      websiteUrl: settings.websiteUrl ?? '',
      localStorage: (settings.localStorage?.data ?? []).map((item) => ({
        key: item.key,
        value: toEditableValue(item.value)
      })),
      cookie: (settings.cookie?.data ?? []).map((item) => ({
        key: item.key,
        value: toEditableValue(item.value)
      }))
    };
  });

  readonly f = form(this.model);

  readonly isEmptyLocalStorage = computed(() =>
    this.model().localStorage.some((setting) => !setting.key || !setting.value)
  );

  readonly isEmptyCookie = computed(() =>
    this.model().cookie.some((setting) => !setting.key || !setting.value)
  );

  addLocalStorageSetting() {
    this.model.update((m) => ({
      ...m,
      localStorage: [...m.localStorage, { key: '', value: '' }]
    }));
  }

  removeLocalStorageSetting(index: number) {
    this.model.update((m) => ({
      ...m,
      localStorage: m.localStorage.filter((_, i) => i !== index)
    }));
  }

  addCookieSetting() {
    this.model.update((m) => ({
      ...m,
      cookie: [...m.cookie, { key: '', value: '' }]
    }));
  }

  removeCookieSetting(index: number) {
    this.model.update((m) => ({
      ...m,
      cookie: m.cookie.filter((_, i) => i !== index)
    }));
  }

  async onFormSubmit(): Promise<void> {
    const params = this.route.parent?.params
      ? await firstValueFrom(this.route.parent.params)
      : undefined;
    const projectSlug = params?.['projectSlug'];
    if (!projectSlug) return;

    const current = this.model();
    const settings: Partial<ApplicationSetting> = {
      websiteUrl: current.websiteUrl ?? '',
      localStorage: {
        data: current.localStorage.map((item) => ({
          key: item.key,
          value: item.value
        }))
      },
      cookie: {
        data: current.cookie.map((item) => ({
          key: item.key,
          value: item.value
        }))
      }
    };

    try {
      await firstValueFrom(
        this.settingsService.updateApplicationSetting(projectSlug, settings)
      );
    } catch (error) {
      console.error('Error: ', error);
    }
  }
}
