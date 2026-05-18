import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getPublicDestinationBySlug } from '../../src/app/shared/services/destination/destination-catalog';

const CANONICAL_ORIGIN = 'https://ng-gtm-sample.vercel.app';
const APP_ROOT = resolve(__dirname, '../..');
const DIST_BROWSER_ROOT = resolve(
  APP_ROOT,
  process.env['NG_GTM_SAMPLE_OUTPUT_PATH'] ??
    '../../dist/apps/ng-gtm-sample/browser'
);

describe('SEO prerender artifacts', () => {
  it('prerenders the public home route with indexable metadata', () => {
    const document = readPrerenderedDocument('home');

    expect(document.title).toBe('Travel With GTM | Demo Travel Catalog');
    expect(getMetaContent(document, 'meta[name="description"]')).toContain(
      'prerendered demo experience'
    );
    expect(getMetaContent(document, 'meta[name="robots"]')).toBe(
      'index,follow'
    );
    expect(getCanonicalHref(document)).toBe(`${CANONICAL_ORIGIN}/home`);
    expect(getMetaContent(document, 'meta[property="og:url"]')).toBe(
      `${CANONICAL_ORIGIN}/home`
    );
    expect(getMetaContent(document, 'meta[property="og:image"]')).toBe(
      `${CANONICAL_ORIGIN}/assets/logo.png`
    );
    expect(getBodyHtml(document)).toContain('sample-loading-shell');
    expect(getBodyHtml(document)).toContain('aria-label="loading"');
  });

  it('prerenders the public destinations route with canonical metadata', () => {
    const document = readPrerenderedDocument('product', 'destinations');

    expect(document.title).toBe('Destinations | Travel With GTM');
    expect(getMetaContent(document, 'meta[name="description"]')).toContain(
      'public travel destination catalog'
    );
    expect(getMetaContent(document, 'meta[name="robots"]')).toBe(
      'index,follow'
    );
    expect(getCanonicalHref(document)).toBe(
      `${CANONICAL_ORIGIN}/product/destinations`
    );
    expect(getMetaContent(document, 'meta[property="og:url"]')).toBe(
      `${CANONICAL_ORIGIN}/product/destinations`
    );
    expect(getBodyHtml(document)).toContain('id="content-chooser"');
    expect(getBodyHtml(document)).toContain('id="search_destination"');
    expect(getBodyText(document)).toContain('Switzerland');
  });

  it('prerenders a destination detail route with slug-driven canonical and social tags', () => {
    const destination = getPublicDestinationBySlug('san-francisco');

    expect(destination).toBeTruthy();
    if (!destination) {
      throw new Error('Expected san-francisco to exist in the public catalog.');
    }

    const document = readPrerenderedDocument(
      'product',
      'details',
      destination.slug
    );
    const expectedImage = toAbsoluteSeoUrl(
      destination.imageBig || destination.image1 || '/assets/logo.png'
    );

    expect(document.title).toBe(`${destination.title} | Travel With GTM`);
    expect(getMetaContent(document, 'meta[name="description"]')).toContain(
      destination.title
    );
    expect(getMetaContent(document, 'meta[name="robots"]')).toBe(
      'index,follow'
    );
    expect(getCanonicalHref(document)).toBe(
      `${CANONICAL_ORIGIN}/product/details/${destination.slug}`
    );
    expect(getMetaContent(document, 'meta[property="og:url"]')).toBe(
      `${CANONICAL_ORIGIN}/product/details/${destination.slug}`
    );
    expect(getMetaContent(document, 'meta[property="og:image"]')).toBe(
      expectedImage
    );
    expect(getMetaContent(document, 'meta[name="twitter:image"]')).toBe(
      expectedImage
    );
    expect(getHeadingText(document)).toBe(destination.title);
    expect(getBodyText(document)).toContain('Destination Details');
  });

  it('prerenders the public not-found route with a noindex canonical', () => {
    const document = readPrerenderedDocument('404');

    expect(document.title).toBe('Page Not Found | Travel With GTM');
    expect(getMetaContent(document, 'meta[name="robots"]')).toBe(
      'noindex,follow'
    );
    expect(getCanonicalHref(document)).toBe(`${CANONICAL_ORIGIN}/404`);
    expect(getHeadingText(document)).toBe('Page not found');
    expect(getBodyText(document)).toContain('Go to home');
  });
});

function readPrerenderedDocument(...routeSegments: string[]): Document {
  const filePath = resolve(DIST_BROWSER_ROOT, ...routeSegments, 'index.html');

  expect(
    existsSync(filePath),
    `Expected prerendered artifact to exist at ${filePath}.`
  ).toBe(true);

  const html = readFileSync(filePath, 'utf8');

  return new DOMParser().parseFromString(html, 'text/html');
}

function getMetaContent(document: Document, selector: string): string | null {
  return document.querySelector<HTMLMetaElement>(selector)?.content ?? null;
}

function getCanonicalHref(document: Document): string | null {
  return (
    document
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.getAttribute('href') ?? null
  );
}

function getHeadingText(document: Document): string {
  return document.querySelector('h1')?.textContent?.trim() ?? '';
}

function getBodyText(document: Document): string {
  return document.body?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function getBodyHtml(document: Document): string {
  return document.body?.innerHTML ?? '';
}

function toAbsoluteSeoUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.replace(/^\.\//, '');
  const relativePath = normalizedPath.startsWith('/')
    ? normalizedPath
    : `/${normalizedPath}`;

  return `${CANONICAL_ORIGIN}${relativePath}`;
}
