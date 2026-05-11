import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP_SRC_ROOT = resolve(__dirname, '../../');

describe('SEO static artifacts', () => {
  it('publishes a robots.txt file that points crawlers at the production sitemap', () => {
    const robots = readFileSync(resolve(APP_SRC_ROOT, 'robots.txt'), 'utf8');

    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain(
      'Sitemap: https://tag-check-documentation.vercel.app/sitemap.xml'
    );
  });

  it('publishes a localized sitemap for every indexable page and excludes the app workspace', () => {
    const sitemap = readFileSync(resolve(APP_SRC_ROOT, 'sitemap.xml'), 'utf8');

    expect(sitemap).toContain(
      '<loc>https://tag-check-documentation.vercel.app/en/</loc>'
    );
    expect(sitemap).toContain(
      '<loc>https://tag-check-documentation.vercel.app/zh-hant/about</loc>'
    );
    expect(sitemap).toContain(
      '<loc>https://tag-check-documentation.vercel.app/ja/objectives</loc>'
    );
    expect(sitemap).toContain(
      '<loc>https://tag-check-documentation.vercel.app/zh-hans/documentation/getting-started</loc>'
    );
    expect(sitemap).toContain('hreflang="x-default"');
    expect(sitemap).not.toContain('/en/app');
    expect(sitemap).not.toContain('/zh-hant/app');
    expect(sitemap).not.toContain('/zh-hans/app');
    expect(sitemap).not.toContain('/ja/app');
  });
});
