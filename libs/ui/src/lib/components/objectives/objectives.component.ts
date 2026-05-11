import { Component, Inject, LOCALE_ID } from '@angular/core';
import { getLocaleConfig } from '../../locale/locale-routing';

@Component({
  selector: 'lib-objectives',
  standalone: true,
  templateUrl: './objectives.component.html',
  styleUrls: ['./objectives.component.scss']
})
export class ObjectivesComponent {
  constructor(@Inject(LOCALE_ID) private readonly locale: string) {}
  getLocalizedSvgPath(): string {
    const assetSegment = getLocaleConfig(this.locale).assetSegment;
    return `/assets/i18n/${assetSegment}/tag_check_system_${assetSegment}.drawio.svg`;
  }
}
