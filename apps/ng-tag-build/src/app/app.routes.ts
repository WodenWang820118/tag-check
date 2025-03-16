import { Route } from '@angular/router';

export const routes: Route[] = [
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
