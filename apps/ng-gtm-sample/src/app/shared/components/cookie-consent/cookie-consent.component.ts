import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { ConsentService } from '../../services/consent/consent.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

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

  readonly consentService = inject(ConsentService);

  constructor() {
    effect(() => {
      const categories = this.consentService.consentCategories$();
      this.analyticsModel = categories.analytics;
      this.measurementModel = categories.measurement;
      this.audienceModel = categories.audience;
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

  savePreferences() {
    this.consentService.updateConsentCategories({
      analytics: this.analyticsModel,
      measurement: this.measurementModel,
      audience: this.audienceModel
    });
    this.consent();
    this.hide();
  }

  acceptAll() {
    this.analyticsModel = true;
    this.measurementModel = true;
    this.audienceModel = true;
    this.consentService.updateConsentCategories({
      analytics: true,
      measurement: true,
      audience: true
    });
    this.consent();
    this.hide();
  }

  switchModal() {
    this.showModal.set(!this.showModal());
  }

  consent() {
    this.consentService.hasConsent();
  }
}
