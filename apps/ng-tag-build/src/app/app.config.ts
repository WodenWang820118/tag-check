import { LOCALE_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  PreloadAllModules,
  provideRouter,
  Route,
  withPreloading
} from '@angular/router';

const appLang = localStorage.getItem('locale') || 'en';
const routes: Route[] = [
  {
    path: '',
    loadComponent: () => import('@ui').then((m) => m.TagBuildAppComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('@ui').then((m) => m.AboutComponent)
  },
  {
    path: 'objectives',
    loadComponent: () => import('@ui').then((m) => m.ObjectivesComponent)
  }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(), // required
    provideHttpClient(), // required
    provideRouter(routes, withPreloading(PreloadAllModules)),
    { provide: LOCALE_ID, useValue: appLang }
  ]
};
