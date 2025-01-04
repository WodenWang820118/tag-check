import { MatSelectModule } from '@angular/material/select';
import { Component, Inject, LOCALE_ID } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

interface Language {
  code: 'en' | 'zh-hant' | 'zh-hans' | 'ja';
  label: string;
}

@Component({
  selector: 'lib-lang-select',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, MatIconModule],
  template: `
    <mat-form-field appearance="outline">
      <mat-select
        [(value)]="selectedLang"
        (selectionChange)="changeLocale(); reloadPage()"
      >
        <mat-select-trigger>
          <mat-icon class="language-icon">language</mat-icon>
          {{ selectedLangLabel }}
        </mat-select-trigger>
        @for (lang of languages; track lang.code) {
          <mat-option value="{{ lang.code }}">
            {{ lang.label }}
          </mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styleUrls: ['./lang-select.component.scss']
})
export class LangSelectComponent {
  selectedLang: 'en' | 'zh-hant' | 'zh-hans' | 'ja' = 'en';
  languages: Language[] = [
    { code: 'en', label: 'English' },
    {
      code: 'zh-hant',
      label: '繁體中文'
    },
    {
      code: 'zh-hans',
      label: '简体中文'
    },
    { code: 'ja', label: '日本語' }
  ];
  selectedLangLabel = 'English';

  constructor(@Inject(LOCALE_ID) public locale: string) {
    this.detectLocale();
  }

  detectLocale() {
    const locale = localStorage.getItem('locale') || this.locale;
    this.selectedLang = locale as 'en' | 'zh-hant' | 'zh-hans' | 'ja';

    const browserLang = navigator.language;
    if (browserLang.startsWith('en')) {
      this.selectedLang = 'en';
    } else if (browserLang.startsWith('zh-hans')) {
      this.selectedLang = 'zh-hans';
    } else if (browserLang.startsWith('zh-hant')) {
      this.selectedLang = 'zh-hant';
    } else if (browserLang.startsWith('ja')) {
      this.selectedLang = 'ja';
    }

    this.detectLocaleLabel();
  }

  detectLocaleLabel() {
    this.selectedLangLabel = this.languages.find(
      (lang) => lang.code === this.selectedLang
    )!.label;
  }

  changeLocale() {
    localStorage.setItem('locale', this.selectedLang.toLowerCase());
    this.selectedLangLabel = this.getSelectedLanguage().label;
  }

  reloadPage() {
    window.location.reload();
  }

  getSelectedLanguage(): Language {
    return this.languages.find((lang) => lang.code === this.selectedLang)!;
  }
}
