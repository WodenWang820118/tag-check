import { RenderMode } from '@angular/ssr';
import { DOCUMENTATION_ROUTE_SLUGS, SUPPORTED_LOCALES } from '@ui';
import { describe, expect, it } from 'vitest';
import { serverRoutes } from './app.routes.server';

describe('serverRoutes', () => {
  it('marks docs and public pages as prerenderable inside each localized build root', () => {
    const prerenderRoutes = getServerPaths(RenderMode.Prerender);

    expect(prerenderRoutes).toEqual(
      expect.arrayContaining(['', 'about', 'objectives', 'documentation/:name'])
    );

    for (const { urlSegment } of SUPPORTED_LOCALES) {
      expect(prerenderRoutes).not.toContain(urlSegment);
      expect(prerenderRoutes).not.toContain(`${urlSegment}/about`);
      expect(prerenderRoutes).not.toContain(`${urlSegment}/objectives`);
      expect(prerenderRoutes).not.toContain(
        `${urlSegment}/documentation/:name`
      );
    }
  });

  it('keeps direct app compatibility URLs client-rendered', () => {
    const clientRoutes = getServerPaths(RenderMode.Client);

    expect(clientRoutes).toContain('app');
    expect(clientRoutes).toContain('app/**');
    for (const { urlSegment } of SUPPORTED_LOCALES) {
      expect(clientRoutes).not.toContain(`${urlSegment}/app`);
      expect(clientRoutes).not.toContain(`${urlSegment}/app/**`);
    }
    expect(clientRoutes).toContain('**');
  });

  it('does not prerender arbitrary unsupported locale prefixes', () => {
    const serverPaths = serverRoutes.map((route) => route.path);

    expect(serverPaths).not.toContain('xx-unsupported');
    expect(serverPaths).not.toContain('xx-unsupported/documentation/:name');
    expect(serverRoutes.at(-1)).toEqual(
      expect.objectContaining({
        path: '**',
        renderMode: RenderMode.Client
      })
    );
  });

  it('enumerates every documentation slug for prerendering', async () => {
    const documentationRoutes = serverRoutes.filter((route) =>
      route.path.endsWith('documentation/:name')
    );

    expect(documentationRoutes).toHaveLength(1);
    for (const documentationRoute of documentationRoutes) {
      expect(documentationRoute.getPrerenderParams).toBeTypeOf('function');
      await expect(documentationRoute.getPrerenderParams?.()).resolves.toEqual(
        DOCUMENTATION_ROUTE_SLUGS.map((name) => ({ name }))
      );
    }
  });
});

function getServerPaths(renderMode: RenderMode): string[] {
  return serverRoutes
    .filter((route) => route.renderMode === renderMode)
    .map((route) => route.path);
}
