import {
  ApplicationConfig,
  ErrorHandler,
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
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideMarkdown, SANITIZE } from 'ngx-markdown';
import * as Sentry from '@sentry/angular';
import { apiRequestIdInterceptor } from './shared/services/api/api-request-id.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([apiRequestIdInterceptor])),
    provideMarkdown({
      sanitize: {
        provide: SANITIZE,
        useValue: SecurityContext.NONE
      }
    }),
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
