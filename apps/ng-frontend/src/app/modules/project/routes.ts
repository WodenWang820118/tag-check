import { Routes } from '@angular/router';
import {
  projectInfoResolver,
  projectSettingResolver
} from './resolvers/project.resolver';
import {
  projectReportResolver,
  reportPageResolver
} from './resolvers/report.resolver';
import {
  getFileReportResolver,
  getProjectSlugResolver
} from './resolvers/file-report.resolver';
import { getProjectFormSettingsResolver } from './resolvers/project-form-settings.resolver';

export const PROJECT_ROUTES: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    loadComponent: () =>
      import('./views/project-view/project-view.component').then(
        (m) => m.ProjectViewComponent
      ),
    resolve: {
      projectSetting: projectSettingResolver,
      projectInfo: projectInfoResolver,
      projectReport: projectReportResolver,
      projectSlug: getProjectSlugResolver
    },
    children: [
      {
        path: '',
        title: 'Tests',
        loadComponent: () =>
          import('./views/report-big-table/report-big-table.component').then(
            (m) => m.ReportBigTableComponent
          )
      },
      {
        path: 'tag-build',
        title: 'TagBuild',
        loadChildren: () =>
          import('../tag-build/routes').then((m) => m.TAG_BUILD_ROUTES)
      },
      {
        path: 'buckets',
        title: 'Reports',
        loadComponent: () =>
          import('./views/buckets-view/buckets-view.component').then(
            (m) => m.BucketsViewComponent
          ),
        resolve: {
          fileReports: getFileReportResolver,
          projectSlug: getProjectSlugResolver
        }
      },
      {
        path: 'settings/project-info',
        title: 'Project information',
        loadComponent: () =>
          import('../../shared/components/project-info-form/project-info-form.component').then(
            (m) => m.ProjectInfoFormComponent
          ),
        resolve: {
          projectInfo: getProjectFormSettingsResolver
        }
      },
      {
        path: 'settings/pre-loading-values',
        title: 'Pre-loading values',
        loadComponent: () =>
          import('../../shared/components/application-form/application-form.component').then(
            (m) => m.ApplicationFormComponent
          ),
        resolve: {
          projectInfo: getProjectFormSettingsResolver
        }
      },
      {
        path: 'settings/authentication',
        title: 'Authentication',
        loadComponent: () =>
          import('../../shared/components/authentication-form/authentication-form.component').then(
            (m) => m.AuthenticationFormComponent
          ),
        resolve: {
          projectInfo: getProjectFormSettingsResolver
        }
      },
      {
        path: 'settings/gtm',
        title: 'Google Tag Manager',
        loadComponent: () =>
          import('../../shared/components/gtm-form/gtm-form.component').then(
            (m) => m.GtmFormComponent
          ),
        resolve: {
          projectInfo: getProjectFormSettingsResolver
        }
      },
      {
        path: 'settings/advanced-browser-settings',
        title: 'Browser settings',
        loadComponent: () =>
          import('../../shared/components/browser-form/browser-form.component').then(
            (m) => m.BrowserFormComponent
          ),
        resolve: {
          projectInfo: getProjectFormSettingsResolver
        }
      },
      {
        path: 'settings/project-io',
        title: 'Export or delete project',
        loadComponent: () =>
          import('../../shared/components/project-io-form/project-io-form.component').then(
            (m) => m.ProjectIoFormComponent
          )
      },
      {
        path: ':eventId',
        title: 'Test details',
        loadComponent: () =>
          import('./views/detail-view/detail-view.component').then(
            (m) => m.DetailViewComponent
          ),
        resolve: {
          page: reportPageResolver
        }
      }
    ]
  }
];
