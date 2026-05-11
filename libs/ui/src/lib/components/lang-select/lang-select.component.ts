import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, Inject, LOCALE_ID, PLATFORM_ID } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import {
  buildLocalizedPath,
  getLocaleConfig,
  stripLocalePrefix,
  SUPPORTED_LOCALES,
  type SupportedLocaleCode
} from '../../locale/locale-routing';

@Component({
  selector: 'lib-lang-select',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, MatIconModule],
  template: `
    <mat-form-field
      appearance="outline"
      color="primary"
      class="density-compact"
    >
      <mat-select
        [value]="selectedLocale"
        (selectionChange)="changeLocale($event.value)"
        aria-label="Select language"
      >
        <mat-select-trigger>
          <mat-icon class="language-icon">language</mat-icon>
          {{ selectedLangLabel }}
        </mat-select-trigger>
        @for (lang of languages; track lang.code) {
          <mat-option [value]="lang.code">
            {{ lang.label }}
          </mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
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

  changeLocale(nextLocale: SupportedLocaleCode): void {
    this.selectedLocale = getLocaleConfig(nextLocale).code;

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const currentLocation = this.document.location;
    const logicalPath = stripLocalePrefix(currentLocation.pathname);
    const nextPath = buildLocalizedPath(logicalPath, this.selectedLocale);
    currentLocation.href = `${nextPath}${currentLocation.search}${currentLocation.hash}`;
  }
}
