import { Routes } from '@angular/router';
import { treeNodeResolver } from './resolvers/documentation.resolver';

/**
 * Documentation routes: the sidebar shell, with each page at `:name` and
 * the index redirecting to the introduction.
 */
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
        }
      }
    ]
  }
];
