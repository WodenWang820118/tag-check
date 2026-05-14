import { TestBed } from '@angular/core/testing';
import {
  Router,
  RouterStateSnapshot,
  convertToParamMap,
  provideRouter
} from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { destinationSlugGuard } from './destination-slug.guard';

describe('destinationSlugGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([])]
    });

    router = TestBed.inject(Router);
  });

  it('allows navigation when the slug exists in the public catalog', () => {
    const result = TestBed.runInInjectionContext(() =>
      destinationSlugGuard(
        {
          paramMap: convertToParamMap({ slug: 'san-francisco' })
        } as never,
        {} as RouterStateSnapshot
      )
    );

    expect(result).toBe(true);
  });

  it('redirects legacy destination ids to the canonical slug route', () => {
    const result = TestBed.runInInjectionContext(() =>
      destinationSlugGuard(
        {
          paramMap: convertToParamMap({ slug: 'city001' }),
          queryParams: { app_source: 'email' },
          fragment: 'pricing'
        } as never,
        {} as RouterStateSnapshot
      )
    );

    expect(
      router.serializeUrl(result as ReturnType<typeof router.createUrlTree>)
    ).toBe('/product/details/switzerland?app_source=email#pricing');
  });

  it('preserves complex query parameters and fragments when redirecting legacy ids', () => {
    const result = TestBed.runInInjectionContext(() =>
      destinationSlugGuard(
        {
          paramMap: convertToParamMap({ slug: 'isl004' }),
          queryParams: {
            q: 'a+b & c=d',
            utm_campaign: 'summer sale',
            ref: 'email/newsletter'
          },
          fragment: 'section-1/sub-section'
        } as never,
        {} as RouterStateSnapshot
      )
    );

    expect(
      router.serializeUrl(result as ReturnType<typeof router.createUrlTree>)
    ).toBe(
      '/product/details/fuerteventura?q=a%2Bb%20%26%20c%3Dd&utm_campaign=summer%20sale&ref=email%2Fnewsletter#section-1/sub-section'
    );
  });

  it('redirects to /404 when the slug is unknown or missing', () => {
    const unknownSlugResult = TestBed.runInInjectionContext(() =>
      destinationSlugGuard(
        {
          paramMap: convertToParamMap({ slug: 'unknown-destination' }),
          queryParams: {}
        } as never,
        {} as RouterStateSnapshot
      )
    );
    const missingSlugResult = TestBed.runInInjectionContext(() =>
      destinationSlugGuard(
        {
          paramMap: convertToParamMap({}),
          queryParams: {}
        } as never,
        {} as RouterStateSnapshot
      )
    );

    expect(
      router.serializeUrl(
        unknownSlugResult as ReturnType<typeof router.createUrlTree>
      )
    ).toBe('/404');
    expect(
      router.serializeUrl(
        missingSlugResult as ReturnType<typeof router.createUrlTree>
      )
    ).toBe('/404');
  });
});
