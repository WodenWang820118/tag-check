import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, test } from 'vitest';

import {
  buildLocaleDocumentationTarget,
  createRedirectHtml,
  DEFAULT_DOCUMENTATION_PATH,
  DEFAULT_LOCALE_PATH,
  DEFAULT_PRODUCT_DOC_LOCALE_SUBPATHS,
  escapeHtml,
  normalizeAbsolutePath,
  normalizeDirectoryPath,
  writeProductDocRedirects
} from './write-root-redirect.ts';
import { SUPPORTED_LOCALES } from '../../../../libs/ui/src/lib/locale/locale-routing.ts';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

test('path helpers normalize locale-aware documentation targets', () => {
  assert.equal(
    normalizeAbsolutePath('documentation/introduction/'),
    '/documentation/introduction'
  );
  assert.equal(normalizeDirectoryPath('en'), '/en/');
  assert.equal(normalizeDirectoryPath('/zh-hant/'), '/zh-hant/');
  assert.equal(
    buildLocaleDocumentationTarget('zh-hant'),
    '/zh-hant/documentation/introduction'
  );
  assert.equal(
    buildLocaleDocumentationTarget('/ja/', '/custom/start/'),
    '/ja/custom/start'
  );
  assert.deepEqual(
    DEFAULT_PRODUCT_DOC_LOCALE_SUBPATHS,
    SUPPORTED_LOCALES.map(({ urlSegment }) => urlSegment)
  );
});

test('redirect html marks redirect pages as noindex', () => {
  const html = createRedirectHtml('/en/documentation/introduction');

  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(
    html,
    /window\.location\.replace\("\/en\/documentation\/introduction"\)/
  );
});

test('redirect html escapes html and script targets', () => {
  const target = '/en/documentation/introduction?next="bad"&lang=<zh></script>';
  const html = createRedirectHtml(target);
  const escapedTarget = escapeHtml(target);
  const scriptContent =
    html.match(/<script>\s*([\s\S]*?)\s*<\/script>/)?.[1] ?? '';

  assert.match(
    html,
    /content="0; url=\/en\/documentation\/introduction\?next=&quot;bad&quot;&amp;lang=&lt;zh&gt;&lt;\/script&gt;"/
  );
  assert.ok(html.includes(`<link rel="canonical" href="${escapedTarget}">`));
  assert.ok(html.includes(`<a href="${escapedTarget}">${escapedTarget}</a>`));
  assert.ok(
    scriptContent.includes(
      'window.location.replace("/en/documentation/introduction?next=\\"bad\\"\\u0026lang=\\u003Czh\\u003E\\u003C/script\\u003E");'
    )
  );
  assert.ok(!scriptContent.includes('</script>'));
});

test('writeProductDocRedirects emits root and locale app redirect entrypoints', async () => {
  const outputDirectory = mkdtempSync(
    join(tmpdir(), 'tag-check-ng-product-doc-redirects-')
  );
  tempRoots.push(outputDirectory);

  const result = await writeProductDocRedirects({
    outputDirectory,
    rootRedirectTarget: DEFAULT_LOCALE_PATH,
    documentationPath: DEFAULT_DOCUMENTATION_PATH
  });

  assert.equal(result.rootIndexFile, resolve(outputDirectory, 'index.html'));
  assert.equal(
    result.appIndexFile,
    resolve(outputDirectory, 'app', 'index.html')
  );
  assert.deepEqual(
    result.localeAppIndexFiles,
    DEFAULT_PRODUCT_DOC_LOCALE_SUBPATHS.map((localeSubpath) =>
      resolve(outputDirectory, localeSubpath, 'app', 'index.html')
    )
  );

  const rootHtml = readFileSync(result.rootIndexFile, 'utf8');
  const appHtml = readFileSync(result.appIndexFile, 'utf8');

  assert.match(rootHtml, /url=\/en\//);
  assert.match(rootHtml, /window\.location\.replace\("\/en\/"\)/);
  assert.match(appHtml, /\/en\/documentation\/introduction/);

  for (const localeSubpath of DEFAULT_PRODUCT_DOC_LOCALE_SUBPATHS) {
    const html = readFileSync(
      resolve(outputDirectory, localeSubpath, 'app', 'index.html'),
      'utf8'
    );

    assert.match(
      html,
      new RegExp(
        buildLocaleDocumentationTarget(localeSubpath).replaceAll('/', '\\/')
      )
    );
    assert.match(html, /<meta name="robots" content="noindex">/);
  }
});
