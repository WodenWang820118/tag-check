import { Route } from '@angular/router';
import {
  AboutComponent,
  DOCS_ROUTES,
  LandingPageComponent,
  ObjectivesComponent,
  TagBuildAppComponent
} from '@ui';

export const appRoutes: Route[] = [
  {
    path: '',
    component: LandingPageComponent,
    data: { seoKey: 'landing' }
  },
  {
    path: 'app',
    component: TagBuildAppComponent,
    data: { seoKey: 'app' }
  },
  {
    path: 'documentation',
    children: DOCS_ROUTES,
    data: { seoKey: 'documentation' }
  },
  {
    path: 'about',
    component: AboutComponent,
    data: { seoKey: 'about' }
  },
  {
    path: 'objectives',
    component: ObjectivesComponent,
    data: { seoKey: 'objectives' }
  },
  {
    path: '**',
    redirectTo: ''
  }
];
