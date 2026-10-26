import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  Inject,
  LOCALE_ID,
  PLATFORM_ID,
  ChangeDetectionStrategy
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  buildLocalizedPath,
  getLocaleConfig,
  stripLocalePrefix,
  SUPPORTED_LOCALES,
  type SupportedLocaleCode
} from '../../locale/locale-routing';

/**
 * Language picker of the public sites. Each locale is a separate build, so
 * choosing one loads the same route under the other locale's URL prefix.
 *
 * A native select rather than mat-select: the picker sits in every page's
 * toolbar, and mat-select brought the form field, overlay and forms
 * packages (about 200 kB) into the sites' initial bundle.
 */
@Component({
  selector: 'lib-lang-select',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <label class="lang-select">
      <mat-icon class="lang-select__icon" aria-hidden="true">language</mat-icon>
      <select
        class="lang-select__control"
        aria-label="Select language"
        data-testid="lang-select"
        (change)="onSelect($event)"
      >
        @for (lang of languages; track lang.code) {
          <option [value]="lang.code" [selected]="lang.code === selectedLocale">
            {{ lang.label }}
          </option>
        }
      </select>
      <mat-icon class="lang-select__arrow" aria-hidden="true"
        >arrow_drop_down</mat-icon
      >
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./lang-select.component.scss']
})
export class LangSelectComponent {
  readonly languages = SUPPORTED_LOCALES;
  selectedLocale: SupportedLocaleCode;

  constructor(
    @Inject(LOCALE_ID) locale: string,
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {
    this.selectedLocale = getLocaleConfig(locale).code;
  }

  get selectedLangLabel(): string {
    return getLocaleConfig(this.selectedLocale).label;
  }

  onSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement | null)?.value;
    const next = this.languages.find((lang) => lang.code === value);
    if (next) {
      this.changeLocale(next.code);
    }
  }

  changeLocale(nextLocale: SupportedLocaleCode): void {
    const nextLocaleConfig = getLocaleConfig(nextLocale);
    this.selectedLocale = nextLocaleConfig.code;

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      globalThis.localStorage?.setItem('locale', nextLocaleConfig.assetSegment);
    } catch {
      // Reading localStorage throws when the browser blocks site data; the
      // preference is optional, the navigation below is not.
    }

    const currentLocation = this.document.location;
    const logicalPath = stripLocalePrefix(currentLocation.pathname);
    const nextPath = buildLocalizedPath(logicalPath, this.selectedLocale);
    currentLocation.href = `${nextPath}${currentLocation.search}${currentLocation.hash}`;
  }
}
