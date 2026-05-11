import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  PreloadAllModules,
  provideRouter,
  withPreloading
} from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(), // required
    provideRouter(routes, withPreloading(PreloadAllModules))
  ]
};
