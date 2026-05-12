import { RenderMode } from '@angular/ssr';
import { describe, expect, it } from 'vitest';
import { publicDestinationSlugs } from './shared/services/destination/destination-catalog';
import { serverRoutes } from './app.routes.server';

describe('serverRoutes', () => {
  it('prerenders only the public SEO surface and keeps private flows client-rendered', () => {
    expect(serverRoutes).toEqual([
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
      expect.objectContaining({
        path: 'product/details/:slug',
        renderMode: RenderMode.Prerender
      }),
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
    ]);
  });

  it('enumerates every destination slug for detail prerendering', async () => {
    const detailRoute = serverRoutes.find(
      (route) => route.path === 'product/details/:slug'
    );

    expect(detailRoute?.getPrerenderParams).toBeTypeOf('function');
    await expect(detailRoute?.getPrerenderParams?.()).resolves.toEqual(
      publicDestinationSlugs.map((slug) => ({ slug }))
    );
  });
});
