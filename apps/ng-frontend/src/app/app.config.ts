import {
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
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
import { provideHttpClient } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';
import * as Sentry from '@sentry/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES, withPreloading(PreloadAllModules)),
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
      return;
    })
  ]
};
