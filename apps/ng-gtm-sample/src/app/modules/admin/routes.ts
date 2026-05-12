import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/home/home.component').then((m) => m.HomeComponent),
    children: [
      {
        path: 'dashboard',
        data: { seoKey: 'admin' },
        loadComponent: () =>
          import('./views/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          )
      },
      {
        path: 'add-data',
        data: { seoKey: 'admin' },
        loadComponent: () =>
          import('./views/add-data/add-data.component').then(
            (m) => m.AddDataComponent
          )
      }
    ]
  }
];
