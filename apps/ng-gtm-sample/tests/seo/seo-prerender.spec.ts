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
    expectPwaMetadata(document);
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
    expectPwaMetadata(document);
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
    expectPwaMetadata(document);
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
    expectPwaMetadata(document);
    expect(getHeadingText(document)).toBe('Page not found');
    expect(getBodyText(document)).toContain('Go to home');
  });

  it('emits service worker and manifest artifacts without HTML fallbacks', () => {
    const serviceWorker = readDistArtifact('ngsw-worker.js');
    const ngsw = parseNgswManifest();
    const manifest = parseJsonArtifact<WebManifest>('manifest.webmanifest');

    expectNotHtmlFallback('ngsw-worker.js', serviceWorker);
    expectNotHtmlFallback('ngsw.json', readDistArtifact('ngsw.json'));
    expectNotHtmlFallback(
      'manifest.webmanifest',
      readDistArtifact('manifest.webmanifest')
    );

    expect(serviceWorker).toContain('ngsw');
    expect(ngsw.configVersion).toBe(1);
    expect(manifest.start_url).toBe('home');
    expect(manifest.theme_color).toBe('#2563eb');
  });

  it('caches the static CSR shell and prerendered offline routes in ngsw.json', () => {
    const ngsw = parseNgswManifest();
    const appShell = getAssetGroup(ngsw, 'app-shell');
    const staticAssets = getAssetGroup(ngsw, 'static-assets');

    expect(ngsw.index).toBe('/index.csr.html');
    expect(appShell.urls).toContain('/index.csr.html');
    expect(appShell.urls).toContain('/manifest.webmanifest');
    expect(staticAssets.urls).toContain('/home/index.html');
    expect(staticAssets.urls).toContain('/404/index.html');
  });
});

interface NgswManifest {
  configVersion: number;
  index: string;
  assetGroups: NgswAssetGroup[];
}

interface NgswAssetGroup {
  name: string;
  urls: string[];
}

interface WebManifest {
  start_url: string;
  theme_color: string;
}

function readPrerenderedDocument(...routeSegments: string[]): Document {
  const filePath = resolve(DIST_BROWSER_ROOT, ...routeSegments, 'index.html');

  expect(
    existsSync(filePath),
    `Expected prerendered artifact to exist at ${filePath}.`
  ).toBe(true);

  const html = readFileSync(filePath, 'utf8');

  return new DOMParser().parseFromString(html, 'text/html');
}

function readDistArtifact(...segments: string[]): string {
  const filePath = resolve(DIST_BROWSER_ROOT, ...segments);

  expect(existsSync(filePath), `Expected dist artifact at ${filePath}.`).toBe(
    true
  );

  return readFileSync(filePath, 'utf8');
}

function parseNgswManifest(): NgswManifest {
  return parseJsonArtifact<NgswManifest>('ngsw.json');
}

function parseJsonArtifact<T>(...segments: string[]): T {
  return JSON.parse(readDistArtifact(...segments)) as T;
}

function getAssetGroup(ngsw: NgswManifest, groupName: string): NgswAssetGroup {
  const assetGroup = ngsw.assetGroups.find(({ name }) => name === groupName);

  expect(assetGroup, `Expected ngsw asset group "${groupName}".`).toBeTruthy();
  if (!assetGroup) {
    throw new Error(`Expected ngsw asset group "${groupName}".`);
  }

  return assetGroup;
}

function expectNotHtmlFallback(artifactName: string, content: string): void {
  expect(
    content,
    `Expected ${artifactName} to be its generated artifact, not an HTML fallback.`
  ).not.toMatch(/^\s*(?:<!doctype html>|<html[\s>])/i);
}

function expectPwaMetadata(document: Document): void {
  expect(getManifestHref(document)).toBe('manifest.webmanifest');
  expect(getMetaContent(document, 'meta[name="theme-color"]')).toBe('#2563eb');
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

function getManifestHref(document: Document): string | null {
  return (
    document
      .querySelector<HTMLLinkElement>('link[rel="manifest"]')
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
