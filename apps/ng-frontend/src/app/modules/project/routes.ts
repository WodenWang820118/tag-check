import { Routes } from '@angular/router';

export const PROJECT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/project-view/project-view.component').then(
        (m) => m.ProjectViewComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./views/report-big-table/report-big-table.component').then(
            (m) => m.ReportBigTableComponent
          )
      },
      {
        path: 'tag-build',
        loadChildren: () =>
          import('../tag-build/routes').then((m) => m.TAG_BUILD_ROUTES)
      },
      {
        path: 'buckets',
        loadComponent: () =>
          import('./views/buckets-view/buckets-view.component').then(
            (m) => m.BucketsViewComponent
          )
      },
      {
        path: 'settings/project-info',
        loadComponent: () =>
          import(
            '../../shared/components/project-info-form/project-info-form.component'
          ).then((m) => m.ProjectInfoFormComponent)
      },
      {
        path: 'settings/pre-loading-values',
        loadComponent: () =>
          import(
            '../../shared/components/application-form/application-form.component'
          ).then((m) => m.ApplicationFormComponent)
      },
      {
        path: 'settings/authentication',
        loadComponent: () =>
          import(
            '../../shared/components/authentication-form/authentication-form.component'
          ).then((m) => m.AuthenticationFormComponent)
      },
      {
        path: 'settings/gtm',
        loadComponent: () =>
          import('../../shared/components/gtm-form/gtm-form.component').then(
            (m) => m.GtmFormComponent
          )
      },
      {
        path: 'settings/advanced-browser-settings',
        loadComponent: () =>
          import(
            '../../shared/components/browser-form/browser-form.component'
          ).then((m) => m.BrowserFormComponent)
      },
      {
        path: 'settings/project-io',
        loadComponent: () =>
          import(
            '../../shared/components/project-io-form/project-io-form.component'
          ).then((m) => m.ProjectIoFormComponent)
      },
      {
        path: ':eventId',
        loadComponent: () =>
          import('./views/detail-view/detail-view.component').then(
            (m) => m.DetailViewComponent
          )
      }
    ]
  }
];
