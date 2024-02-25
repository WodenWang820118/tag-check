import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadChildren: () =>
      import('./modules/entry/entry.module').then((m) => m.EntryModule),
  },
  {
    path: 'projects/:projectSlug',
    loadChildren: () =>
      import('./modules/project/project.module').then((m) => m.ProjectModule),
  },
];
