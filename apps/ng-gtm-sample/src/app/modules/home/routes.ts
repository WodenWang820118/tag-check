export const HOME_ROUTES = [
  {
    path: '',
    loadComponent: () =>
      import('./views/home/home.component').then((m) => m.HomeComponent),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./views/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: '',
        loadComponent: () =>
          import('./views/main/main.component').then((m) => m.MainComponent),
      },
    ],
  },
];
