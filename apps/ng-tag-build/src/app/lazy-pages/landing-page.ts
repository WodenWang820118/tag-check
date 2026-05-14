import { Component, LOCALE_ID, inject } from '@angular/core';
import {
  LandingPageComponent as SharedLandingPageComponent,
  buildLocalizedPath
} from '@ui';

@Component({
  standalone: true,
  imports: [SharedLandingPageComponent],
  template: `
    <lib-landing-page [primaryLink]="primaryLink"></lib-landing-page>
  `
})
export class LandingPageComponent {
  private readonly locale = inject(LOCALE_ID);

  readonly primaryLink = {
    href: buildLocalizedPath('/app', this.locale),
    label: $localize`:@@landing.cta.primary:Open Tag Build`,
    icon: 'build',
    logicalPath: '/app',
    matchStrategy: 'exact'
  } as const;
}
