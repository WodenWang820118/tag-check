import { Route } from '@angular/router';

export const routes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./lazy-pages/landing-page').then((m) => m.LandingPageComponent),
    data: { seoKey: 'landing' }
  },
  {
    path: 'app',
    loadComponent: () =>
      import('./lazy-pages/tag-build-app').then((m) => m.TagBuildAppComponent),
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
      import('./lazy-pages/objectives-page').then((m) => m.ObjectivesComponent),
    data: { seoKey: 'objectives' }
  },
  {
    path: '**',
    redirectTo: ''
  }
];
