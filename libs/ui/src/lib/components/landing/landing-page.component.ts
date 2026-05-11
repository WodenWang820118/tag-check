import { Component, Inject, LOCALE_ID } from '@angular/core';
import { buildLocalizedPath } from '../../locale/locale-routing';

@Component({
  selector: 'lib-landing-page',
  standalone: true,
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent {
  readonly appPath: string;
  readonly aboutPath: string;
  readonly objectivesPath: string;

  constructor(@Inject(LOCALE_ID) locale: string) {
    this.appPath = buildLocalizedPath('/app', locale);
    this.aboutPath = buildLocalizedPath('/about', locale);
    this.objectivesPath = buildLocalizedPath('/objectives', locale);
  }
}
