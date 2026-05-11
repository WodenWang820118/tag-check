import { Routes } from '@angular/router';
import { treeNodeResolver } from './resolvers/documentation.resolver';
import { treeNodeDeactivateGuard } from './guards/documentation.guard';

export const DOCS_ROUTES: Routes = [
  {
    path: '',
    data: { seoKey: 'documentation' },
    loadComponent: () =>
      import('./views/documentation-view.component').then(
        (m) => m.HelpCenterViewComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'introduction',
        pathMatch: 'full'
      },
      {
        path: ':name',
        data: { seoKey: 'documentation' },
        loadComponent: () =>
          import('./components/main-content/main-content.component').then(
            (m) => m.MainContentComponent
          ),
        resolve: {
          data: treeNodeResolver
        },
        canDeactivate: [treeNodeDeactivateGuard]
      }
    ]
  }
];
