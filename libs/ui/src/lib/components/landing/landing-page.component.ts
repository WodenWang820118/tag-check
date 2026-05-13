import { Component, Inject, LOCALE_ID, input } from '@angular/core';
import { buildLocalizedPath } from '../../locale/locale-routing';
import { type SharedNavigationLink } from '../navigation-link';

@Component({
  selector: 'lib-landing-page',
  standalone: true,
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent {
  readonly primaryLink = input.required<SharedNavigationLink>();
  readonly aboutPath: string;
  readonly objectivesPath: string;

  constructor(@Inject(LOCALE_ID) locale: string) {
    this.aboutPath = buildLocalizedPath('/about', locale);
    this.objectivesPath = buildLocalizedPath('/objectives', locale);
  }
}
