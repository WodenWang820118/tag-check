import { describe, expect, it } from 'vitest';
import { appRoutes } from './app.routes';

describe('appRoutes', () => {
  it('defines localized seo-aware public routes', () => {
    expect(appRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '',
          data: { seoKey: 'landing' }
        }),
        expect.objectContaining({
          path: 'app',
          data: { seoKey: 'app' }
        }),
        expect.objectContaining({
          path: 'documentation',
          data: { seoKey: 'documentation' }
        }),
        expect.objectContaining({
          path: 'about',
          data: { seoKey: 'about' }
        }),
        expect.objectContaining({
          path: 'objectives',
          data: { seoKey: 'objectives' }
        }),
        expect.objectContaining({
          path: '**',
          redirectTo: ''
        })
      ])
    );
  });
});
