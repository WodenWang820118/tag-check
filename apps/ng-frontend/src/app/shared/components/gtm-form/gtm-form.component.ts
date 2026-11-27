import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { disabled, form, FormField } from '@angular/forms/signals';
import { ApplicationSetting, ProjectSetting } from '@utils';
import { SettingsService } from '../../services/api/settings/settings.service';

interface GtmFormModel {
  gtmPreviewModeUrl: string;
  tagManagerUrl: string;
  isAccompanyMode: boolean;
  isRequestCheck: boolean;
}

/**
 * Settings > Google Tag Manager: the GTM Preview URL, accompanied mode,
 * which needs that URL, and the request check, which needs a
 * measurement ID.
 */
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
    MatCardModule,
    MatCheckboxModule,
    MatTooltipModule,
    FormField
  ],
  templateUrl: './gtm-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./gtm-form.component.scss']
})
export class GtmFormComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly routeData = toSignal(this.route.data);

  readonly projectInfo = computed(
    () => this.routeData()?.['projectInfo'] as ProjectSetting | undefined
  );

  readonly hasMeasurementId = computed(() => {
    const measurementId = this.projectInfo()?.measurementId;
    return typeof measurementId === 'string' && measurementId.trim().length > 0;
  });

  readonly model = linkedSignal<GtmFormModel>(() => {
    const gtm = this.projectInfo()?.applicationSettings?.gtm;
    const hasMeasurement = this.hasMeasurementId();
    const previewUrl = gtm?.gtmPreviewModeUrl ?? '';
    const hasPreviewUrl = previewUrl.trim().length > 0;
    return {
      gtmPreviewModeUrl: previewUrl,
      tagManagerUrl: gtm?.tagManagerUrl ?? '',
      isAccompanyMode: hasPreviewUrl ? (gtm?.isAccompanyMode ?? false) : false,
      isRequestCheck: hasMeasurement ? (gtm?.isRequestCheck ?? false) : false
    };
  });

  readonly f = form(this.model, (p) => {
    disabled(p.isAccompanyMode, {
      when: ({ valueOf }) => {
        const url = valueOf(p.gtmPreviewModeUrl);
        return !url || url.trim().length === 0;
      }
    });
    disabled(p.isRequestCheck, {
      when: () => !this.hasMeasurementId()
    });
  });

  constructor() {
    effect(() => {
      const url = this.model().gtmPreviewModeUrl;
      const hasUrl = typeof url === 'string' && url.trim().length > 0;
      if (!hasUrl && this.model().isAccompanyMode) {
        this.model.update((m) => ({ ...m, isAccompanyMode: false }));
      }
    });

    effect(() => {
      const hasMeasurement = this.hasMeasurementId();
      if (!hasMeasurement && this.model().isRequestCheck) {
        this.model.update((m) => ({ ...m, isRequestCheck: false }));
      }
    });
  }

  get requestCheckTooltip(): string {
    return (
      'Request check validates network requests against the Measurement ID set in Project Information. ' +
      'Provide a Measurement ID in project settings to use this mode.'
    );
  }

  goToProjectInfo() {
    void this.router.navigate(['../project-info'], {
      relativeTo: this.route
    });
  }

  onReset() {
    this.f.gtmPreviewModeUrl().value.set('');
  }

  async onSubmit(): Promise<void> {
    const params = this.route.parent?.params
      ? await firstValueFrom(this.route.parent.params)
      : undefined;
    const projectSlug = params?.['projectSlug'];
    if (!projectSlug) return;

    const current = this.model();
    const settings: Partial<ApplicationSetting> = {
      gtm: {
        gtmPreviewModeUrl: current.gtmPreviewModeUrl || '',
        isAccompanyMode: current.isAccompanyMode || false,
        isRequestCheck: current.isRequestCheck || false,
        tagManagerUrl: current.tagManagerUrl || ''
      }
    };

    try {
      await firstValueFrom(
        this.settingsService.updateApplicationSetting(projectSlug, settings)
      );
    } catch (err) {
      console.error(err);
    }
  }
}
