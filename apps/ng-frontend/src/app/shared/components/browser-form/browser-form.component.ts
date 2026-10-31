import {
  ChangeDetectionStrategy,
  Component,
  inject,
  linkedSignal,
  ViewEncapsulation
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { form, FormField } from '@angular/forms/signals';
import { BrowserSetting, ProjectSetting } from '@utils';
import { SettingsService } from '../../services/api/settings/settings.service';

interface BrowserFormModel {
  headless: boolean;
  settings: { value: string }[];
}

/** Settings > Browser settings: headless mode and the browser arguments. */
@Component({
  selector: 'app-browser-form',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    FormField
  ],
  templateUrl: './browser-form.component.html',
  styleUrls: ['./browser-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None
})
export class BrowserFormComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly route = inject(ActivatedRoute);

  private readonly routeData = toSignal(this.route.data);

  readonly model = linkedSignal<BrowserFormModel>(() => {
    const settings = this.routeData()?.['projectInfo'] as
      | ProjectSetting
      | undefined;
    return {
      headless: settings?.browserSettings?.headless ?? false,
      settings: (settings?.browserSettings?.browser ?? []).map((val) => ({
        value: val
      }))
    };
  });

  readonly f = form(this.model);

  addBrowserSetting() {
    this.model.update((m) => ({
      ...m,
      settings: [...m.settings, { value: '' }]
    }));
  }

  removeBrowserSetting(index: number) {
    this.model.update((m) => ({
      ...m,
      settings: m.settings.filter((_, i) => i !== index)
    }));
  }

  async onFormSubmit(): Promise<void> {
    const params = this.route.parent?.params
      ? await firstValueFrom(this.route.parent.params)
      : undefined;
    const projectSlug = params?.['projectSlug'];
    if (!projectSlug) return;

    const current = this.model();
    const browserSettings: Partial<BrowserSetting> = {
      headless: current.headless,
      browser: current.settings.map((setting) => setting.value)
    };

    try {
      await firstValueFrom(
        this.settingsService.updateBrowserSetting(projectSlug, browserSettings)
      );
    } catch (error) {
      console.error('Error: ', error);
    }
  }
}
