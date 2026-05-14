import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';

describe('routes', () => {
  it('defines SEO-aware public routes and a dedicated 404 fallback', () => {
    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'home',
          data: { seoKey: 'home' }
        }),
        expect.objectContaining({
          path: 'product'
        }),
        expect.objectContaining({
          path: 'transaction'
        }),
        expect.objectContaining({
          path: 'admin'
        }),
        expect.objectContaining({
          path: '404',
          data: { seoKey: 'not-found' }
        }),
        expect.objectContaining({
          path: '',
          redirectTo: 'home'
        }),
        expect.objectContaining({
          path: '**',
          redirectTo: '404'
        })
      ])
    );
  });
});
