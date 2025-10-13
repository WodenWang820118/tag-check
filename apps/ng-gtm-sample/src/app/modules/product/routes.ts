export const PRODUCT_ROUTES = [
  {
    path: '',
    loadComponent: () =>
      import('./views/home/home.component').then((m) => m.HomeComponent),
    children: [
      {
        path: 'destinations',
        loadComponent: () =>
          import('./views/destination/destination.component').then(
            (m) => m.DestinationComponent
          ),
      },
      {
        path: 'details/:id',
        loadComponent: () =>
          import('./views/details/details.component').then(
            (m) => m.DetailsComponent
          ),
      },
    ],
  },
];
