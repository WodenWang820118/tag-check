import { describe, expect, it } from 'vitest';
import { DOCS_ROUTES } from './routes';
import { treeNodeDeactivateGuard } from './guards/documentation.guard';
import { treeNodeResolver } from './resolvers/documentation.resolver';

describe('DOCS_ROUTES', () => {
  it('redirects the documentation shell index to introduction', () => {
    const shellRoute = requireDefined(
      DOCS_ROUTES.find((route) => route.path === ''),
      'Expected the documentation shell route to exist.'
    );
    const shellChildren = shellRoute.children ?? [];
    const redirectRoute = shellChildren.find((route) => route.path === '');

    expect(
      requireDefined(
        redirectRoute,
        'Expected the documentation shell route to have an index redirect.'
      )
    ).toMatchObject({
      path: '',
      redirectTo: 'introduction',
      pathMatch: 'full'
    });
  });

  it('keeps the markdown content route inside the documentation shell', () => {
    const shellRoute = requireDefined(
      DOCS_ROUTES.find((route) => route.path === ''),
      'Expected the documentation shell route to exist.'
    );
    const shellChildren = shellRoute.children ?? [];
    const contentRoute = requireDefined(
      shellChildren.find((route) => route.path === ':name'),
      'Expected the documentation shell route to include the markdown route.'
    );

    expect(shellRoute.loadComponent).toBeDefined();
    expect(shellRoute.data).toMatchObject({ seoKey: 'documentation' });
    expect(contentRoute.loadComponent).toBeDefined();
    expect(contentRoute.data).toMatchObject({ seoKey: 'documentation' });
    expect(contentRoute.resolve?.['data']).toBe(treeNodeResolver);
    expect(contentRoute.canDeactivate).toContain(treeNodeDeactivateGuard);
  });
});

function requireDefined<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
}
