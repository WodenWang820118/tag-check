import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  PreloadAllModules,
  provideRouter,
  Route,
  withPreloading,
} from '@angular/router';

const routes: Route[] = [
  {
    path: '',
    loadComponent: () => import('@ui').then((m) => m.TagBuildAppComponent),
  },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(), // required
    provideHttpClient(), // required
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
};
