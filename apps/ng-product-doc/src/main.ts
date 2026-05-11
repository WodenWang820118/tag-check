import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import { getLocaleFromPathname } from '@ui';
import { appConfig } from './app/app.config';

const appLocale = getLocaleFromPathname(globalThis.location?.pathname ?? '/');
const appLang = appLocale.assetSegment;

initLocale(appLang)
  .then(() => import('./app/app.component'))
  .then((comp) => bootstrapApplication(comp.AppComponent, appConfig))
  .catch((err) => console.error(err));

async function initLocale(locale: string): Promise<void> {
  const localeData = await loadLocaleData(locale);
  if (localeData) {
    registerLocaleData(localeData);
  }

  persistLocalePreference(locale);
}

async function loadLocaleData(locale: string): Promise<unknown | null> {
  switch (locale) {
    case 'zh-hant':
      return (await import('@angular/common/locales/zh-Hant')).default;
    case 'zh-hans':
      return (await import('@angular/common/locales/zh-Hans')).default;
    case 'ja':
      return (await import('@angular/common/locales/ja')).default;
    default:
      return null;
  }
}

function persistLocalePreference(locale: string): void {
  globalThis.localStorage?.setItem('locale', locale);
}
