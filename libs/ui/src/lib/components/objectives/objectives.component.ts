import { Component, Inject, LOCALE_ID } from '@angular/core';

@Component({
  selector: 'lib-objectives',
  standalone: true,
  templateUrl: './objectives.component.html',
  styleUrls: ['./objectives.component.scss']
})
export class ObjectivesComponent {
  constructor(@Inject(LOCALE_ID) private locale: string) {}
  getLocalizedSvgPath(): string {
    return `assets/i18n/${this.locale}/tag_check_system_${this.locale}.drawio.svg`;
  }
}
