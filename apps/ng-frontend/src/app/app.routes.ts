import { Route } from '@angular/router';
import { HomeViewComponent } from './views/home-view/home-view.component';
import { InitProjectViewComponent } from './views/init-project-view/init-project-view.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: HomeViewComponent,
  },
  {
    path: 'init-project',
    component: InitProjectViewComponent,
  },
  {
    path: 'projects/:projectSlug',
    loadChildren: () =>
      import('./modules/project/project.module').then((m) => m.ProjectModule),
  },
];
