/**
 * Updates <lastmod> dates in both app sitemaps to today's date (YYYY-MM-DD).
 * Run automatically as part of the build-static and build-tag-build commands.
 *
 * Usage:  node tools/scripts/update-sitemap-lastmod.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const rootDir = process.cwd();
const today = new Date().toISOString().slice(0, 10);

const sitemaps = [
  join(rootDir, 'apps/ng-product-doc/src/sitemap.xml'),
  join(rootDir, 'apps/ng-tag-build/src/sitemap.xml')
];

for (const sitemapPath of sitemaps) {
  const original = readFileSync(sitemapPath, 'utf8');
  const updated = original.replace(
    /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g,
    `<lastmod>${today}</lastmod>`
  );

  if (updated !== original) {
    writeFileSync(sitemapPath, updated, 'utf8');
    console.log(`Updated lastmod to ${today} in ${sitemapPath}`);
  } else {
    console.log(`No lastmod tags to update in ${sitemapPath}`);
  }
}
