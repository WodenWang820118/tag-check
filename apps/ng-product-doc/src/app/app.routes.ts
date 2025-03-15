import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'documentation',
    loadChildren: () => import('@ui').then((m) => m.DOCS_ROUTES)
  }
];
