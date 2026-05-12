import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    data: { seoKey: 'home' },
    loadChildren: () =>
      import('./modules/home/routes').then((m) => m.HOME_ROUTES)
  },
  {
    path: 'product',
    loadChildren: () =>
      import('./modules/product/routes').then((m) => m.PRODUCT_ROUTES)
  },
  {
    path: 'transaction',
    loadChildren: () =>
      import('./modules/transaction/routes').then((m) => m.TRANSACTION_ROUTES)
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./modules/admin/routes').then((m) => m.ADMIN_ROUTES)
  },
  {
    path: '404',
    data: { seoKey: 'not-found' },
    loadComponent: () =>
      import('./not-found/not-found.component').then((m) => m.NotFoundComponent)
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: '404' }
];
