import { type Route } from '@angular/router';
import { SUPPORTED_LOCALES } from '@ui';

export const routes: Route[] = [
  ...createTagBuildRoutes(),
  ...SUPPORTED_LOCALES.map(({ urlSegment }) => ({
    path: urlSegment,
    children: createTagBuildRoutes()
  })),
  {
    path: '**',
    redirectTo: ''
  }
];

function createTagBuildRoutes(): Route[] {
  return [
    {
      path: '',
      pathMatch: 'full',
      loadComponent: () =>
        import('./lazy-pages/landing-page').then((m) => m.LandingPageComponent),
      data: { seoKey: 'landing' }
    },
    {
      path: 'app',
      loadComponent: () =>
        import('./lazy-pages/tag-build-app').then(
          (m) => m.TagBuildAppComponent
        ),
      data: { seoKey: 'app' }
    },
    {
      path: 'about',
      loadComponent: () =>
        import('./lazy-pages/about-page').then((m) => m.AboutComponent),
      data: { seoKey: 'about' }
    },
    {
      path: 'objectives',
      loadComponent: () =>
        import('./lazy-pages/objectives-page').then(
          (m) => m.ObjectivesComponent
        ),
      data: { seoKey: 'objectives' }
    }
  ];
}
