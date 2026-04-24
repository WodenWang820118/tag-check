import { describe, expect, it } from 'vitest';
import { appRoutes } from './app.routes';

describe('appRoutes', () => {
  it('uses declarative redirects for the product documentation entry routes', () => {
    expect(appRoutes).toContainEqual({
      path: '',
      redirectTo: 'documentation/introduction',
      pathMatch: 'full'
    });
    expect(appRoutes).toContainEqual({
      path: '**',
      redirectTo: 'documentation/introduction'
    });
  });
});
