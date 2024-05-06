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
          import(
            './components/report-big-table/report-big-table.component'
          ).then((m) => m.ReportBigTableComponent),
      },
      {
        path: 'tag-build',
        loadChildren: () =>
          import('../tag-build/routes').then((m) => m.TAG_BUILD_ROUTES),
      },
      {
        path: 'project-info',
        loadComponent: () =>
          import(
            '../../shared/components/project-info-form/project-info-form.component'
          ).then((m) => m.ProjectInfoFormComponent),
      },
      {
        path: 'pre-loading-values',
        loadComponent: () =>
          import(
            '../../shared/components/application-form/application-form.component'
          ).then((m) => m.ApplicationFormComponent),
      },
      {
        path: 'authentication',
        loadComponent: () =>
          import(
            '../../shared/components/authentication-form/authentication-form.component'
          ).then((m) => m.AuthenticationFormComponent),
      },
      {
        path: 'gtm',
        loadComponent: () =>
          import('../../shared/components/gtm-form/gtm-form.component').then(
            (m) => m.GtmFormComponent
          ),
      },
      {
        path: 'advanced-browser-settings',
        loadComponent: () =>
          import(
            '../../shared/components/browser-form/browser-form.component'
          ).then((m) => m.BrowserFormComponent),
      },
      {
        path: 'new-report',
        loadComponent: () =>
          import('./views/new-report-view/new-report-view.component').then(
            (m) => m.NewReportViewComponent
          ),
      },
      {
        path: ':eventId',
        loadComponent: () =>
          import('./views/detail-view/detail-view.component').then(
            (m) => m.DetailViewComponent
          ),
      },
    ],
  },
];
