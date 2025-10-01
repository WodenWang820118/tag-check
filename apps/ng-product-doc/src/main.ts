import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { registerLocaleData } from '@angular/common';
import { loadTranslations } from '@angular/localize';

const appLang = localStorage.getItem('locale') || 'en';

// Init provided language
initLanguage(appLang)
  // Only load text after locale is initialized to translate static file
  .then(() => import('./app/app.component'))
  .then((comp) => bootstrapApplication(comp.AppComponent, appConfig))
  .catch((err) => console.error(err));

async function initLanguage(locale: string): Promise<void> {
  if (locale === 'en') {
    // Default behavior, no changes required
    return;
  }
  const response = await fetch(`/locale/messages.${locale}.xlf`);
  const xlfContent = await response.text();

  // Parse XLF content
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xlfContent, 'text/xml');
  const translations = new Map<string, string>();

  // Extract translations from XLF
  const transUnits = xmlDoc.getElementsByTagName('trans-unit');
  for (const unit of Array.from(transUnits)) {
    const id = unit.getAttribute('id');
    const target = unit.getElementsByTagName('source')[0].textContent;
    if (id && target) {
      translations.set(id, target);
    }
  }

  console.log('Loaded translations:', translations);

  // Load translations into Angular
  $localize.locale = locale;
  loadTranslations(Object.fromEntries(translations));

  // Dynamic import of locale data based on selected language
  let localeModule;
  switch (locale) {
    case 'zh-hant':
      localeModule = await import(`@angular/common/locales/zh-Hant`);
      break;
    case 'zh-hans':
      localeModule = await import(`@angular/common/locales/zh-Hans`);
      break;
    case 'ja':
      localeModule = await import(`@angular/common/locales/ja`);
      break;
    default:
      localeModule = await import(`@angular/common/locales/en`);
  }
  // Register the locale data
  console.log('Loaded locale:', localeModule.default);
  registerLocaleData(localeModule.default);
}
