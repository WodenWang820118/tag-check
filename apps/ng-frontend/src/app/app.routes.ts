import { Route } from '@angular/router';

export const APP_ROUTES: Route[] = [
  {
    path: 'topics',
    loadChildren: () =>
      import('./modules/help-center/routes').then((m) => m.HELP_CENTER_ROUTES),
  },
  {
    path: 'projects/:projectSlug',
    loadChildren: () =>
      import('./modules/project/routes').then((m) => m.PROJECT_ROUTES),
  },
  {
    path: '',
    loadChildren: () =>
      import('./modules/entry/routes').then((m) => m.ENTRY_ROUTES),
  },
];
