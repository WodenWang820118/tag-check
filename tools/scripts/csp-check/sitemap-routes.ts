import { existsSync, readdirSync } from 'node:fs';
import { join, posix, relative } from 'node:path';

const LOC_TAG_PATTERN = /<loc\b[^>]*>([\s\S]*?)<\/loc>/gi;

function decodeXmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

/**
 * Extracts de-duplicated, sorted route paths (including query strings, without
 * origin) from every `<loc>` element in a `<urlset>` sitemap XML document.
 */
export function routesFromSitemap(xml: string, origin: string): string[] {
  const routes = new Set<string>();

  for (const match of xml.matchAll(LOC_TAG_PATTERN)) {
    const rawLoc = decodeXmlEntities(match[1]?.trim() ?? '');
    if (!rawLoc) {
      continue;
    }

    try {
      const parsed = new URL(rawLoc, origin);
      routes.add(`${parsed.pathname}${parsed.search}`);
    } catch {
      // Skip malformed URLs in sitemap entries.
    }
  }

  return [...routes].sort();
}

function collectHtmlRoutes(
  rootDir: string,
  currentDir: string,
  routes: Set<string>
): void {
  const entries = readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(currentDir, entry.name);
    if (entry.isDirectory()) {
      collectHtmlRoutes(rootDir, fullPath, routes);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const relPath = relative(rootDir, fullPath).replaceAll('\\', '/');
    const lowerName = entry.name.toLowerCase();

    if (lowerName === 'index.html') {
      const dirPart = posix.dirname(relPath);
      routes.add(dirPart === '.' ? '/' : `/${dirPart}/`);
    } else if (lowerName.endsWith('.html')) {
      routes.add(`/${relPath}`);
    }
  }
}

/**
 * Discovers routes from a built static directory: one route per `index.html`
 * (`about/index.html` -> `/about/`) and per other `.html` file, sorted.
 */
export function routesFromDirectory(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  const routes = new Set<string>();
  collectHtmlRoutes(dir, dir, routes);
  return [...routes].sort();
}
