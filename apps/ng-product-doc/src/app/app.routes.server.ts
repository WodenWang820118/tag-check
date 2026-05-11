import { RenderMode, type ServerRoute } from '@angular/ssr';
import { DOCUMENTATION_ROUTE_SLUGS } from '@ui';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'about',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'objectives',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'documentation/:name',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return DOCUMENTATION_ROUTE_SLUGS.map((name) => ({ name }));
    }
  },
  {
    path: 'app',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
