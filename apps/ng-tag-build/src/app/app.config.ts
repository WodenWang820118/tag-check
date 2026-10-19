import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  PreloadAllModules,
  provideRouter,
  withPreloading
} from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withXhr()), // required
    provideRouter(routes, withPreloading(PreloadAllModules))
  ]
};
