import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideZoneChangeDetection,
  SecurityContext
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideMarkdown, SANITIZE } from 'ngx-markdown';
import { getLocaleFromPathname } from '@ui';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(),
    ...provideMarkdown({
      sanitize: {
        provide: SANITIZE,
        useValue: SecurityContext.NONE
      }
    }),
    {
      provide: LOCALE_ID,
      useFactory: () => {
        const document = inject(DOCUMENT);
        return getLocaleFromPathname(document.location?.pathname ?? '/').code;
      }
    }
  ]
};
