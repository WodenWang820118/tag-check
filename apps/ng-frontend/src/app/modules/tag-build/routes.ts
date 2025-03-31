import { Routes } from '@angular/router';

export const TAG_BUILD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./views/tag-build-view.component').then(
        (m) => m.TagBuildViewComponent
      )
  }
];
