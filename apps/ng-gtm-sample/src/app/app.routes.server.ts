import { RenderMode, type ServerRoute } from '@angular/ssr';
import { publicDestinationSlugs } from './shared/services/destination/destination-catalog';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'home',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'product/destinations',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'product/details/:slug',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return publicDestinationSlugs.map((slug) => ({ slug }));
    }
  },
  {
    path: '404',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'home/login',
    renderMode: RenderMode.Client
  },
  {
    path: 'transaction/**',
    renderMode: RenderMode.Client
  },
  {
    path: 'admin/**',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
