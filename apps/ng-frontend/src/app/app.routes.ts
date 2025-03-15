import { Route } from '@angular/router';
import {
  ProjectSlugResolver,
  ReportResolver
} from './resolvers/report.resolver';

export const APP_ROUTES: Route[] = [
  {
    path: 'documentation',
    loadChildren: () => import('@ui').then((m) => m.DOCS_ROUTES)
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
