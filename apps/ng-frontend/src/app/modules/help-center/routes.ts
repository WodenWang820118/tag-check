import { Routes } from '@angular/router';

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
      },
    ],
  },
];
