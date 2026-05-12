import { destinationSlugGuard } from '../../shared/guards/destination-slug.guard';

export const PRODUCT_ROUTES = [
  {
    path: '',
    loadComponent: () =>
      import('./views/home/home.component').then((m) => m.HomeComponent),
    children: [
      {
        path: 'destinations',
        data: { seoKey: 'destinations' },
        loadComponent: () =>
          import('./views/destination/destination.component').then(
            (m) => m.DestinationComponent
          )
      },
      {
        path: 'details/:slug',
        canActivate: [destinationSlugGuard],
        data: { seoKey: 'destination-detail' },
        loadComponent: () =>
          import('./views/details/details.component').then(
            (m) => m.DetailsComponent
          )
      }
    ]
  }
];
