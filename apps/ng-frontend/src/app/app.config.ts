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
  TitleStrategy,
  withPreloading
} from '@angular/router';
import { APP_ROUTES } from './app.routes';
import {
  provideHttpClient,
  withInterceptors,
  withXhr
} from '@angular/common/http';
import { provideMarkdown, SANITIZE } from 'ngx-markdown';
import * as Sentry from '@sentry/angular';
import { apiRequestIdInterceptor } from './shared/services/api/api-request-id.interceptor';
import { AppTitleStrategy } from './shared/services/utils/app-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES, withPreloading(PreloadAllModules)),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideHttpClient(withXhr(), withInterceptors([apiRequestIdInterceptor])),
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
