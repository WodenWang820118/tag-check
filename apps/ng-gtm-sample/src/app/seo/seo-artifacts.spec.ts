import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { publicDestinations } from '../shared/services/destination/destination-catalog';

const APP_SRC_ROOT = resolve(__dirname, '../../');
const PUBLIC_ROOT = resolve(APP_SRC_ROOT, '../public');

function readLegacyRedirectHtml(destinationId: string): string {
  return readFileSync(
    resolve(PUBLIC_ROOT, 'product/details', destinationId, 'index.html'),
    'utf8'
  );
}

function extractRedirectScript(redirectHtml: string): string {
  const scriptMatch = redirectHtml.match(/<script>\s*([\s\S]*?)\s*<\/script>/);

  expect(scriptMatch?.[1]).toBeTruthy();
  if (!scriptMatch?.[1]) {
    throw new Error(
      'Expected legacy redirect HTML to include an inline script.'
    );
  }

  return scriptMatch[1];
}

describe('SEO static artifacts', () => {
  it('publishes a robots.txt file that points crawlers at the production sitemap', () => {
    const robots = readFileSync(resolve(APP_SRC_ROOT, 'robots.txt'), 'utf8');

    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /home/login');
    expect(robots).toContain('Disallow: /transaction/');
    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain(
      'Sitemap: https://ng-gtm-integration-sample.vercel.app/sitemap.xml'
    );
  });

  it('publishes a sitemap for every indexable public route and excludes private flows', () => {
    const sitemap = readFileSync(resolve(APP_SRC_ROOT, 'sitemap.xml'), 'utf8');

    expect(sitemap).toContain(
      '<loc>https://ng-gtm-integration-sample.vercel.app/home</loc>'
    );
    expect(sitemap).toContain(
      '<loc>https://ng-gtm-integration-sample.vercel.app/product/destinations</loc>'
    );
    expect(sitemap).toContain(
      '<loc>https://ng-gtm-integration-sample.vercel.app/product/details/san-francisco</loc>'
    );
    expect(sitemap).toContain(
      '<loc>https://ng-gtm-integration-sample.vercel.app/product/details/reunion</loc>'
    );
    expect(sitemap).not.toContain('/home/login');
    expect(sitemap).not.toContain('/transaction/');
    expect(sitemap).not.toContain('/admin/');
    expect(sitemap).not.toContain('/404');
  });

  it('publishes legacy detail redirect assets that preserve query strings and hashes', () => {
    for (const destination of publicDestinations) {
      const redirectHtml = readLegacyRedirectHtml(destination.id);

      expect(redirectHtml).toContain(
        `const target = '/product/details/${destination.slug}';`
      );
      expect(redirectHtml).toContain('window.location.search');
      expect(redirectHtml).toContain('window.location.hash');
      expect(redirectHtml).toContain(
        `content="0; url=/product/details/${destination.slug}"`
      );
    }
  });

  it('executes the shipped redirect script with the canonical slug plus search and hash', () => {
    for (const destination of publicDestinations) {
      const redirectHtml = readLegacyRedirectHtml(destination.id);
      const redirectScript = extractRedirectScript(redirectHtml);
      const replace = vi.fn();

      new Function('window', redirectScript)({
        location: {
          search: '?app_source=email',
          hash: '#pricing',
          replace
        }
      });

      expect(replace).toHaveBeenCalledWith(
        `/product/details/${destination.slug}?app_source=email#pricing`
      );
    }
  });
});
