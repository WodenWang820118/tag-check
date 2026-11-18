import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { routesFromDirectory, routesFromSitemap } from './sitemap-routes.ts';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('routesFromSitemap', () => {
  it('extracts sorted, de-duplicated paths with query strings and without origin', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/en/about</loc></url>
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/search?q=gtm&amp;lang=en</loc></url>
  <url><loc>https://example.com/en/about</loc></url>
  <url><loc>https://other.example.com/ja/#section</loc></url>
</urlset>`;

    expect(routesFromSitemap(xml, 'https://example.com')).toEqual([
      '/',
      '/en/about',
      '/ja/',
      '/search?q=gtm&lang=en'
    ]);
  });

  it('resolves relative loc entries against origin and skips invalid entries', () => {
    const xml = `<urlset>
  <url><loc>/docs/intro</loc></url>
  <url><loc></loc></url>
</urlset>`;

    expect(routesFromSitemap(xml, 'http://127.0.0.1:4200')).toEqual([
      '/docs/intro'
    ]);
  });
});

describe('routesFromDirectory', () => {
  it('maps index.html and other html files to sorted routes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tag-check-csp-routes-'));
    tempRoots.push(dir);

    mkdirSync(join(dir, 'about'), { recursive: true });
    mkdirSync(join(dir, 'en', 'docs'), { recursive: true });
    mkdirSync(join(dir, 'assets'), { recursive: true });

    writeFileSync(join(dir, 'index.html'), '<html></html>');
    writeFileSync(join(dir, '404.html'), '<html></html>');
    writeFileSync(join(dir, 'about', 'index.html'), '<html></html>');
    writeFileSync(join(dir, 'en', 'docs', 'index.html'), '<html></html>');
    writeFileSync(join(dir, 'en', 'docs', 'guide.html'), '<html></html>');
    writeFileSync(join(dir, 'assets', 'app.js'), 'console.log(1);');

    expect(routesFromDirectory(dir)).toEqual([
      '/',
      '/404.html',
      '/about/',
      '/en/docs/',
      '/en/docs/guide.html'
    ]);
  });

  it('returns an empty list when the directory does not exist', () => {
    expect(routesFromDirectory(join(tmpdir(), 'non-existent-csp-dir'))).toEqual(
      []
    );
  });
});
