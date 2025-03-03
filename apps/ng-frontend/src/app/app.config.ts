import {
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  SecurityContext
} from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  Router,
  withPreloading
} from '@angular/router';
import { APP_ROUTES } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';
import * as Sentry from '@sentry/angular';

// TODO: lazy load the ngx-markdown and sentry can save around 70kb from the initial bundle size
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES, withPreloading(PreloadAllModules)),
    provideAnimationsAsync(),
    provideHttpClient(),
    importProvidersFrom(
      MarkdownModule.forRoot({
        sanitize: SecurityContext.NONE
      })
    ),
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: true
      })
    },
    {
      provide: Sentry.TraceService,
      deps: [Router]
    },
    provideAppInitializer(() => {
      const traceService = inject(Sentry.TraceService);
      // If your initializer function does something, include it here
      return; // Just return void directly
    })
  ]
};
