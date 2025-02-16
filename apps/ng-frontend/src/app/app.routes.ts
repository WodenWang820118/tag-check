import { Route } from '@angular/router';
import {
  ProjectSlugResolver,
  ReportResolver
} from './resolvers/report.resolver';

export const APP_ROUTES: Route[] = [
  {
    path: 'help-center',
    loadChildren: () =>
      import('./modules/help-center/routes').then((m) => m.HELP_CENTER_ROUTES)
  },
  {
    path: 'projects/:projectSlug',
    loadChildren: () =>
      import('./modules/project/routes').then((m) => m.PROJECT_ROUTES),
    resolve: {
      reports: ReportResolver,
      projectSlug: ProjectSlugResolver
    }
  },
  {
    path: '',
    loadChildren: () =>
      import('./modules/entry/routes').then((m) => m.ENTRY_ROUTES)
  }
];
