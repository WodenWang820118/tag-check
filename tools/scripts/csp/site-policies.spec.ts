import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  applyPolicyToHtml,
  inlineScriptHashes,
  serializePolicy
} from './build-policy.ts';
import { SITE_POLICIES } from './site-policies.ts';

describe('SITE_POLICIES', () => {
  it('forbids unsafe-inline and unsafe-eval in ng-product-doc script-src', () => {
    const scriptSrc = SITE_POLICIES['ng-product-doc'].directives['script-src'];

    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
  });

  it('enables inline script hashing for ng-product-doc', () => {
    expect(SITE_POLICIES['ng-product-doc'].hashInlineScripts).toBe(true);
  });

  it('leaves scripts unrestricted on ng-gtm-sample, which hosts any GTM container', () => {
    const policy = SITE_POLICIES['ng-gtm-sample'];

    expect(policy.hashInlineScripts).toBe(false);
    expect(Object.keys(policy.directives).sort()).toEqual([
      'base-uri',
      'object-src'
    ]);
  });
});

describe('every site policy', () => {
  it.each(Object.entries(SITE_POLICIES))(
    'serializes each directive %s sets, with its sources',
    (_site, policy) => {
      const serialized = serializePolicy(policy).split('; ');

      for (const [directive, sources] of Object.entries(policy.directives)) {
        expect(serialized).toContain(`${directive} ${sources.join(' ')}`);
      }
      expect(serialized).toHaveLength(Object.keys(policy.directives).length);
    }
  );
});

describe("SITE_POLICIES['ng-tag-build']", () => {
  const policy = SITE_POLICIES['ng-tag-build'];
  const indexHtml = readFileSync(
    fileURLToPath(
      new URL('../../../apps/ng-tag-build/src/index.html', import.meta.url)
    ),
    'utf8'
  );

  it('allows scripts only from the site, GTM and inline-script hashes', () => {
    const scriptSrc = policy.directives['script-src'];

    expect(policy.hashInlineScripts).toBe(true);
    expect(scriptSrc).toEqual(["'self'", 'https://www.googletagmanager.com']);
    expect(policy.directives['object-src']).toEqual(["'none'"]);
  });

  it('allows no Google Fonts stylesheet: index.html links them for the build to inline', () => {
    // Angular's font inlining replaces only rel="stylesheet" links (a failed
    // download fails the build), so no page requests fonts.googleapis.com.
    const fontLinks =
      indexHtml.match(/<link\b[^>]*fonts\.googleapis\.com[^>]*>/g) ?? [];

    expect(fontLinks.length).toBeGreaterThan(0);
    for (const link of fontLinks) {
      expect(link).toMatch(/\brel="stylesheet"/);
    }
    expect(policy.directives['style-src']).toEqual([
      "'self'",
      "'unsafe-inline'"
    ]);
    expect(policy.directives['font-src']).toContain(
      'https://fonts.gstatic.com'
    );
  });

  it("accepts the app's index.html and allows its GTM snippet by hash", () => {
    const [gtmSnippetHash] = inlineScriptHashes(indexHtml);

    const built = applyPolicyToHtml(indexHtml, policy, 'index.html');

    expect(gtmSnippetHash).toBeDefined();
    expect(built).toContain(
      `script-src 'self' https://www.googletagmanager.com ${gtmSnippetHash};`
    );
  });
});
