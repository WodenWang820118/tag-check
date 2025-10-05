import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  signal,
} from '@angular/core';
import { ConsentService } from '../../services/consent/consent.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import {
  ToggleSwitchChangeEvent,
  ToggleSwitchModule,
} from 'primeng/toggleswitch';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ToggleSwitchModule,
    ButtonModule,
  ],
  templateUrl: './cookie-consent.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    if (localStorage.getItem('consentPreferences')) {
      this.consentService.setConsetPreferences(
        JSON.parse(localStorage.getItem('consentPreferences') || '{}')
      );
    } else {
      this.consentService.initConsentPreferences();
    }

    effect(() => {
      this.analyticsModel = this.consentService.analyticsConsentGiven$()();
      this.measurementModel = this.consentService.measurementConsentGiven$()();
      this.audienceModel = this.consentService.audienceConsentGiven$()();
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
    const consent = event.checked;
    console.log(`Analytics consent: ${consent}`);

    if (consent) {
      this.consentService.updateConsentPreferences({
        ad_storage: true,
        analytics_storage: true,
        ad_user_data: true,
        ad_personalization: false,
      });
    } else {
      this.consentService.updateConsentPreferences({
        ad_storage: false,
        analytics_storage: false,
        ad_user_data: false,
        ad_personalization: false,
      });
    }
  }

  acceptMeasurement(event: ToggleSwitchChangeEvent) {
    const consent = event.checked;
    console.log(`Measurement consent: ${consent}`);
    if (consent) {
      this.consentService.updateConsentPreferences({
        ad_storage: true,
        ad_user_data: true,
        analytics_storage: false,
        ad_personalization: false,
      });
    } else {
      this.consentService.updateConsentPreferences({
        ad_storage: false,
        ad_user_data: false,
        analytics_storage: false,
        ad_personalization: false,
      });
    }
  }

  acceptAudience(event: ToggleSwitchChangeEvent) {
    const consent = event.checked;
    console.log(`Audience consent: ${consent}`);
    if (consent) {
      this.consentService.updateConsentPreferences({
        ad_storage: true,
        ad_user_data: true,
        ad_personalization: true,
        analytics_storage: false,
      });
    } else {
      this.consentService.updateConsentPreferences({
        ad_storage: false,
        ad_user_data: false,
        ad_personalization: false,
        analytics_storage: false,
      });
    }
  }

  acceptCookies(event: ToggleSwitchChangeEvent) {
    this.acceptMeasurement(event);
    this.acceptAudience(event);
    this.acceptAnalytics(event);
    this.hide();
  }

  switchModal() {
    this.showModal.set(!this.showModal());
  }

  consent() {
    this.consentService.hasConsent();
  }
}
