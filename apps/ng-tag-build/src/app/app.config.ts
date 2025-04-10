import { LOCALE_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  PreloadAllModules,
  provideRouter,
  withPreloading
} from '@angular/router';
import { routes } from './app.routes';

const appLang = localStorage.getItem('locale') || 'en';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(), // required
    provideHttpClient(), // required
    provideRouter(routes, withPreloading(PreloadAllModules)),
    { provide: LOCALE_ID, useValue: appLang }
  ]
};
