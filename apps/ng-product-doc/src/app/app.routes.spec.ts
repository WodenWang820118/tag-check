import '@angular/localize/init';
import { APP_BASE_HREF, Location } from '@angular/common';
import { Component, LOCALE_ID, PLATFORM_ID } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import {
  Router,
  RouterOutlet,
  convertToParamMap,
  type Params,
  type RedirectFunction,
  provideRouter
} from '@angular/router';
import { SUPPORTED_LOCALES } from '@ui';
import { MarkdownService } from 'ngx-markdown';
import { EMPTY, of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from './app.routes';

type MarkdownServiceMock = {
  getSource: ReturnType<typeof vi.fn>;
  parse: ReturnType<typeof vi.fn>;
  reload$: typeof EMPTY;
  render: ReturnType<typeof vi.fn>;
};

@Component({
  selector: 'app-product-doc-route-test-host',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
class ProductDocRouteTestHostComponent {}

describe('appRoutes', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('keeps direct product-doc routes and redirects legacy app links to docs', () => {
    expect(appRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '',
          pathMatch: 'full',
          data: { seoKey: 'landing' }
        }),
        expect.objectContaining({
          path: 'app',
          redirectTo: expect.any(Function),
          pathMatch: 'full'
        }),
        expect.objectContaining({
          path: 'app/**',
          redirectTo: expect.any(Function)
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
    expect(appRoutes.at(-1)?.path).toBe('**');
  });

  it('registers locale-prefixed routes for all supported locales for cross-locale link handling', () => {
    const topLevelRoutePaths = appRoutes.map((route) => route.path);

    for (const { urlSegment } of SUPPORTED_LOCALES) {
      expect(topLevelRoutePaths).toContain(urlSegment);
    }
    expect(topLevelRoutePaths).not.toContain('xx-unsupported');
  });

  it('redirects legacy app URLs relative to the app root so the locale base href stays', () => {
    const directLegacyAppRoute = appRoutes.find(
      (route) => route.path === 'app/**'
    );
    const target = runRedirect(
      directLegacyAppRoute?.redirectTo,
      { from: 'legacy' },
      'usage'
    );

    expect(target.startsWith('/')).toBe(false);
    expect(target).toBe('documentation/introduction?from=legacy#usage');
  });

  it('leaves unsupported locale prefixes to the wildcard redirect', () => {
    expect(appRoutes.some((route) => route.path === 'xx-unsupported')).toBe(
      false
    );
    expect(appRoutes.at(-1)).toEqual(
      expect.objectContaining({
        path: '**',
        redirectTo: ''
      })
    );
  });

  it('redirects the direct legacy app URL to the documentation entry at runtime', async () => {
    const { fixture, markdown, router } = await setupRouterTest('en-US');

    await navigate(fixture, router, '/app');

    expect(router.url).toBe('/documentation/introduction');
    expect(markdown.getSource).toHaveBeenCalledWith(
      'assets/markdown/en/introduction.md'
    );
  }, 15000);

  it('redirects deep direct legacy app URLs to the documentation entry at runtime', async () => {
    const { fixture, markdown, router } = await setupRouterTest('en-US');

    await navigate(fixture, router, '/app/tag-builder/editor');

    expect(router.url).toBe('/documentation/introduction');
    expect(markdown.getSource).toHaveBeenCalledWith(
      'assets/markdown/en/introduction.md'
    );
  });

  it('preserves direct legacy app URL query params and fragments while redirecting', async () => {
    const { fixture, markdown, router } = await setupRouterTest('en-US');

    await navigate(
      fixture,
      router,
      '/app/tag-builder/editor?from=legacy#usage'
    );

    expect(router.url).toBe('/documentation/introduction?from=legacy#usage');
    expect(markdown.getSource).toHaveBeenCalledWith(
      'assets/markdown/en/introduction.md'
    );
  });

  it('routes locale-prefixed legacy app URLs to the documentation entry', async () => {
    const { fixture, router } = await setupRouterTest('en-US');

    await navigate(fixture, router, '/en/app');

    expect(router.url).toBe('/en/documentation/introduction');
  });

  it('keeps the locale prefix when a legacy app URL is opened under that locale', async () => {
    const { fixture, router } = await setupRouterTest('en-US');

    await navigate(fixture, router, '/ja/app/tag-builder?from=legacy#usage');

    expect(router.url).toBe('/ja/documentation/introduction?from=legacy#usage');
  });

  it('keeps a localized build base href when /app redirects to the documentation entry', async () => {
    const { fixture, location, router } = await setupRouterTest('ja', '/ja/');

    await navigate(fixture, router, '/app?from=legacy#usage');

    expect(router.url).toBe('/documentation/introduction?from=legacy#usage');
    expect(location.prepareExternalUrl(router.url)).toBe(
      '/ja/documentation/introduction?from=legacy#usage'
    );
  });
});

async function setupRouterTest(
  localeId: string,
  baseHref?: string
): Promise<{
  fixture: ComponentFixture<ProductDocRouteTestHostComponent>;
  location: Location;
  markdown: MarkdownServiceMock;
  router: Router;
}> {
  const markdown = {
    getSource: vi.fn().mockReturnValue(of('# Introduction')),
    parse: vi.fn().mockResolvedValue('<h1>Introduction</h1>'),
    reload$: EMPTY,
    render: vi.fn()
  };

  await TestBed.configureTestingModule({
    imports: [ProductDocRouteTestHostComponent],
    providers: [
      provideRouter(appRoutes),
      provideNoopAnimations(),
      { provide: MarkdownService, useValue: markdown },
      { provide: LOCALE_ID, useValue: localeId },
      { provide: PLATFORM_ID, useValue: 'browser' },
      ...(baseHref ? [{ provide: APP_BASE_HREF, useValue: baseHref }] : [])
    ]
  }).compileComponents();

  const fixture = TestBed.createComponent(ProductDocRouteTestHostComponent);
  fixture.detectChanges();

  return {
    fixture,
    location: TestBed.inject(Location),
    markdown,
    router: TestBed.inject(Router)
  };
}

async function navigate(
  fixture: ComponentFixture<ProductDocRouteTestHostComponent>,
  router: Router,
  url: string
): Promise<void> {
  await router.navigateByUrl(url);
  fixture.detectChanges();
  await fixture.whenStable();
}

function runRedirect(
  redirectTo: unknown,
  queryParams: Params = {},
  fragment: string | null = null
): string {
  expect(redirectTo).toBeTypeOf('function');

  const result = (redirectTo as RedirectFunction)({
    routeConfig: null,
    url: [],
    params: {},
    queryParams,
    fragment,
    data: {},
    outlet: 'primary',
    title: undefined,
    paramMap: convertToParamMap({}),
    queryParamMap: convertToParamMap(queryParams)
  } as Parameters<RedirectFunction>[0]);

  expect(result).toBeTypeOf('string');

  return result as string;
}
