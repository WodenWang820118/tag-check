import { Routes } from '@angular/router';
import {
  projectInfoResolver,
  projectSettingResolver
} from './resolvers/project.resolver';
import {
  reportDetailResolver,
  imageResolver,
  videoResolver,
  projectReportResolver
} from './resolvers/report.resolver';
import {
  getFileReportResolver,
  getProjectSlugResolver
} from './resolvers/file-report.resolver';
import { getProjectFormSettingsResolver } from './resolvers/project-form-settings.resolver';
import {
  recordingDetailResolver,
  recordingResolver
} from './resolvers/recording.resolver';
import {
  reportDetailEventIdResolver,
  reportDetailSlugResolver,
  specResolver
} from './resolvers/spec.resolver';

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
      recordings: recordingResolver,
      projectSlug: getProjectSlugResolver
    },
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
          ),
        resolve: {
          fileReports: getFileReportResolver,
          projectSlug: getProjectSlugResolver
        }
      },
      {
        path: 'settings/project-info',
        loadComponent: () =>
          import(
            '../../shared/components/project-info-form/project-info-form.component'
          ).then((m) => m.ProjectInfoFormComponent),
        resolve: {
          projectInfo: getProjectFormSettingsResolver
        }
      },
      {
        path: 'settings/pre-loading-values',
        loadComponent: () =>
          import(
            '../../shared/components/application-form/application-form.component'
          ).then((m) => m.ApplicationFormComponent),
        resolve: {
          projectInfo: getProjectFormSettingsResolver
        }
      },
      {
        path: 'settings/authentication',
        loadComponent: () =>
          import(
            '../../shared/components/authentication-form/authentication-form.component'
          ).then((m) => m.AuthenticationFormComponent),
        resolve: {
          projectInfo: getProjectFormSettingsResolver
        }
      },
      {
        path: 'settings/gtm',
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
        loadComponent: () =>
          import(
            '../../shared/components/browser-form/browser-form.component'
          ).then((m) => m.BrowserFormComponent),
        resolve: {
          projectInfo: getProjectFormSettingsResolver
        }
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
          ),
        resolve: {
          reportDetails: reportDetailResolver,
          image: imageResolver,
          video: videoResolver,
          spec: specResolver,
          recording: recordingDetailResolver,
          projectSlug: reportDetailSlugResolver,
          eventId: reportDetailEventIdResolver
        }
      }
    ]
  }
];
