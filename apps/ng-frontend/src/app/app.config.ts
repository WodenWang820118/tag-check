import {
  APP_INITIALIZER,
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  SecurityContext
} from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { APP_ROUTES } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';
import * as Sentry from '@sentry/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES),
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
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true
    }
  ]
};
