import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'documentation',
    loadChildren: () => import('@ui').then((m) => m.DOCS_ROUTES)
  },
  {
    path: 'about',
    loadComponent: () => import('@ui').then((m) => m.AboutComponent)
  },
  {
    path: 'objectives',
    loadComponent: () => import('@ui').then((m) => m.ObjectivesComponent)
  },
  {
    path: '',
    redirectTo: 'documentation/introduction',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'documentation/introduction'
  }
];
