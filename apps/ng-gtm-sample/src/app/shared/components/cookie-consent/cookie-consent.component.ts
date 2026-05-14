import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  signal
} from '@angular/core';
import { ConsentService } from '../../services/consent/consent.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import {
  ToggleSwitchChangeEvent,
  ToggleSwitchModule
} from 'primeng/toggleswitch';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ToggleSwitchModule,
    ButtonModule
  ],
  templateUrl: './cookie-consent.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CookieConsentComponent {
  analyticsModel = false;
  measurementModel = false;
  audienceModel = false;

  showModal = signal<boolean>(false);
  showCookieConsent = signal<boolean>(false);

  showModalInput = input<boolean>(false);
  showCookieConsentInput = input<boolean>(false);

  constructor(public consentService: ConsentService) {
    const storedConsentPreferences =
      this.consentService.loadStoredConsentPreferences();

    if (storedConsentPreferences) {
      this.consentService.setConsentPreferences(storedConsentPreferences);
    } else {
      this.consentService.initConsentPreferences();
    }

    effect(() => {
      this.analyticsModel = this.consentService.analyticsConsentGiven$();
      this.measurementModel = this.consentService.measurementConsentGiven$();
      this.audienceModel = this.consentService.audienceConsentGiven$();
    });

    effect(() => {
      this.showModal.set(this.showModalInput());
      this.showCookieConsent.set(this.showCookieConsentInput());
    });
  }

  hide() {
    this.showModal.set(false);
  }

  show() {
    this.showModal.set(true);
  }

  showCookieConsentIcon() {
    this.showCookieConsent.set(true);
  }

  hideCookieConsentIcon() {
    this.showCookieConsent.set(false);
  }

  acceptAnalytics(event: ToggleSwitchChangeEvent) {
    this.updateConsentModels({ analytics: event.checked });
  }

  acceptMeasurement(event: ToggleSwitchChangeEvent) {
    this.updateConsentModels({ measurement: event.checked });
  }

  acceptAudience(event: ToggleSwitchChangeEvent) {
    this.updateConsentModels({ audience: event.checked });
  }

  acceptCookies(event: ToggleSwitchChangeEvent) {
    this.updateConsentModels({
      analytics: event.checked,
      measurement: event.checked,
      audience: event.checked
    });
    this.hide();
    this.consent();
  }

  acceptAll() {
    this.consentService.updateConsentPreferences({
      ad_storage: true,
      analytics_storage: true,
      ad_user_data: true,
      ad_personalization: true
    });
    this.analyticsModel = true;
    this.measurementModel = true;
    this.audienceModel = true;
    this.hide();
    this.consent();
  }

  switchModal() {
    this.showModal.set(!this.showModal());
  }

  consent() {
    this.consentService.hasConsent();
  }

  private updateConsentModels(input: {
    analytics?: boolean;
    measurement?: boolean;
    audience?: boolean;
  }) {
    const analytics = input.analytics ?? this.analyticsModel;
    const measurement = input.measurement ?? this.measurementModel;
    const audience = input.audience ?? this.audienceModel;
    const grantsSharedStorage = analytics || measurement || audience;

    this.consentService.updateConsentPreferences({
      analytics_storage: analytics,
      ad_storage: grantsSharedStorage,
      ad_user_data: grantsSharedStorage,
      ad_personalization: audience
    });
  }
}
