import { Routes } from '@angular/router';
import { treeNodeResolver } from './resolvers/help-center.resolver';
import { treeNodeDeactivateGuard } from './guards/help-center.guard';

export const HELP_CENTER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/help-center-view.component').then(
        (m) => m.HelpCenterViewComponent
      ),
    children: [
      {
        path: ':name',
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
