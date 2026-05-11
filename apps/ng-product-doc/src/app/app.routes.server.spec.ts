import { RenderMode } from '@angular/ssr';
import { DOCUMENTATION_ROUTE_SLUGS } from '@ui';
import { describe, expect, it } from 'vitest';
import { serverRoutes } from './app.routes.server';

describe('serverRoutes', () => {
  it('marks public marketing pages for prerender and app routes for client rendering', () => {
    expect(serverRoutes).toEqual([
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
      expect.objectContaining({
        path: 'documentation/:name',
        renderMode: RenderMode.Prerender
      }),
      {
        path: 'app',
        renderMode: RenderMode.Client
      },
      {
        path: '**',
        renderMode: RenderMode.Client
      }
    ]);
  });

  it('enumerates every documentation slug for prerendering', async () => {
    const documentationRoute = serverRoutes.find(
      (route) => route.path === 'documentation/:name'
    );

    expect(documentationRoute?.getPrerenderParams).toBeTypeOf('function');
    await expect(documentationRoute?.getPrerenderParams?.()).resolves.toEqual(
      DOCUMENTATION_ROUTE_SLUGS.map((name) => ({ name }))
    );
  });
});
