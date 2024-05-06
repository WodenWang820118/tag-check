import { Routes } from '@angular/router';

export const ENTRY_ROUTES: Routes = [
  {
    path: 'init-project',
    loadComponent: () =>
      import('./views/init-project-view/init-project-view.component').then(
        (m) => m.InitProjectViewComponent
      ),
  },
  {
    path: 'global-settings',
    loadComponent: () =>
      import(
        './views/global-settings-view/global-settings-view.component'
      ).then((m) => m.GlobalSettingsViewComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./views/home-view/home-view.component').then(
        (m) => m.HomeViewComponent
      ),
  },
];
