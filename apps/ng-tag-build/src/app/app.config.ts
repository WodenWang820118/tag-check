import { LOCALE_ID, ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  PreloadAllModules,
  provideRouter,
  withPreloading
} from '@angular/router';
import { routes } from './app.routes';

const appLang = localStorage.getItem('locale') || 'en';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(), // required
    provideRouter(routes, withPreloading(PreloadAllModules)),
    { provide: LOCALE_ID, useValue: appLang }
  ]
};
