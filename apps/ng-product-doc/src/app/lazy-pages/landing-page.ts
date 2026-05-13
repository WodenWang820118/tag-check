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
    href: buildLocalizedPath('/documentation/introduction', this.locale),
    label: $localize`:@@docs.sidebar.gettingStarted:Getting Started`,
    icon: 'menu_book',
    logicalPath: '/documentation',
    matchStrategy: 'prefix'
  } as const;
}
