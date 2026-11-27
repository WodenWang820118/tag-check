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
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideMarkdown, SANITIZE } from 'ngx-markdown';
import { provideScrollbarPolyfill } from 'ngx-scrollbar';
import { getLocaleFromPathname } from '@ui';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withXhr()),
    // ngx-scrollbar loads its scroll-timeline polyfill from a CDN by default,
    // which the site's Content Security Policy blocks. The build copies the
    // package's own copy into each locale's assets folder.
    provideScrollbarPolyfill('assets/scroll-timeline-polyfill.js'),
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
