import {
  ApplicationConfig,
  importProvidersFrom,
  LOCALE_ID,
  provideZoneChangeDetection,
  SecurityContext
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';

const appLang = localStorage.getItem('locale') || 'en';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideAnimationsAsync(),
    provideHttpClient(),
    importProvidersFrom(
      MarkdownModule.forRoot({
        sanitize: SecurityContext.NONE
      })
    ),
    { provide: LOCALE_ID, useValue: appLang }
  ]
};
