import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  applyPolicyToHtml,
  inlineScriptHashes,
  serializePolicy
} from './build-policy.ts';
import { CSP_DIRECTIVES, SITE_POLICIES } from './site-policies.ts';
import type { SiteCspPolicy } from './site-policies.ts';

function expectedSha256(text: string): string {
  return `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;
}

describe('inlineScriptHashes', () => {
  it('computes SHA-256 of exact inline script text including whitespace', () => {
    const scriptBody = '\n  const x = 1;\n  console.log(x);\n';
    const html = `<html><head><script>${scriptBody}</script></head></html>`;

    expect(inlineScriptHashes(html)).toEqual([expectedSha256(scriptBody)]);
    expect(inlineScriptHashes('<script>const x = 1;</script>')).not.toEqual(
      inlineScriptHashes('<script> const x = 1; </script>')
    );
  });

  it('hashes the text as the browser parses it, with CRLF and CR as LF', () => {
    const parsedBody = '\n  const x = 1;\n  console.log(x);\n';

    expect(
      inlineScriptHashes(
        '<script>\r\n  const x = 1;\r\n  console.log(x);\r\n</script>'
      )
    ).toEqual([expectedSha256(parsedBody)]);
    expect(
      inlineScriptHashes(
        '<script>\r  const x = 1;\r  console.log(x);\r</script>'
      )
    ).toEqual([expectedSha256(parsedBody)]);
  });

  it('ignores scripts with src, application/json, and application/ld+json', () => {
    const html = `
      <html>
        <head>
          <script src="/main.js"></script>
          <script type="application/json">{"a":1}</script>
          <script type="application/ld+json">{"@type":"WebSite"}</script>
        </head>
      </html>
    `;

    expect(inlineScriptHashes(html)).toEqual([]);
  });

  it('hashes inline module and JavaScript MIME type scripts', () => {
    const moduleBody = 'export const ok = true;';
    const jsMimeBody = 'window.ready = true;';
    const html = `
      <script type="module">${moduleBody}</script>
      <script type="text/javascript; charset=utf-8">${jsMimeBody}</script>
    `;

    expect(inlineScriptHashes(html)).toEqual([
      expectedSha256(moduleBody),
      expectedSha256(jsMimeBody)
    ]);
  });
});

describe('serializePolicy', () => {
  it('produces a stable directive order with sorted, de-duplicated hashes', () => {
    const policy = SITE_POLICIES['ng-product-doc'];
    const hashA = expectedSha256('a');
    const hashB = expectedSha256('b');

    const first = serializePolicy(policy, [hashB, hashA, hashB]);
    const second = serializePolicy(policy, [hashA, hashB]);

    expect(first).toBe(second);
    const [sortedFirst, sortedSecond] = [hashA, hashB].sort();
    expect(first).toContain(
      `script-src 'self' https://www.googletagmanager.com ${sortedFirst} ${sortedSecond}`
    );
    expect(first.indexOf('default-src')).toBeLessThan(
      first.indexOf('script-src')
    );
    expect(first.indexOf('script-src')).toBeLessThan(
      first.indexOf('form-action')
    );
  });

  it('writes every directive a policy may set, in CSP_DIRECTIVES order', () => {
    const policy: SiteCspPolicy = {
      hashInlineScripts: false,
      directives: Object.fromEntries(
        [...CSP_DIRECTIVES]
          .reverse()
          .map((directive) => [directive, [`https://${directive}.example`]])
      )
    };

    const serialized = serializePolicy(policy);

    expect(serialized.split('; ')).toEqual(
      CSP_DIRECTIVES.map(
        (directive) => `${directive} https://${directive}.example`
      )
    );
  });
});

describe('applyPolicyToHtml', () => {
  const policy = SITE_POLICIES['ng-product-doc'];

  it('places the CSP meta after meta charset and before scripts and styles', () => {
    const html = [
      '<!doctype html>',
      '<html>',
      '  <head>',
      '    <meta charset="utf-8">',
      '    <link rel="stylesheet" href="styles.css">',
      '    <script>window.x = 1;</script>',
      '  </head>',
      '  <body></body>',
      '</html>'
    ].join('\n');

    const once = applyPolicyToHtml(html, policy, 'index.html');
    const twice = applyPolicyToHtml(once, policy, 'index.html');

    expect(twice).toBe(once);

    const charsetIdx = once.indexOf('<meta charset="utf-8">');
    const cspIdx = once.indexOf('<meta http-equiv="Content-Security-Policy"');
    const linkIdx = once.indexOf('<link rel="stylesheet"');
    const scriptIdx = once.indexOf('<script>');

    expect(cspIdx).toBeGreaterThan(charsetIdx);
    expect(cspIdx).toBeLessThan(linkIdx);
    expect(cspIdx).toBeLessThan(scriptIdx);
    expect(once.match(/http-equiv="Content-Security-Policy"/g)).toHaveLength(1);
  });

  it('places the CSP meta before a script that precedes meta charset', () => {
    const html = [
      '<!doctype html>',
      '<html>',
      '  <head>',
      '    <script>window.gtm = 1;</script>',
      '    <meta charset="utf-8">',
      '  </head>',
      '  <body></body>',
      '</html>'
    ].join('\n');

    const result = applyPolicyToHtml(html, policy, 'index.html');
    const cspIdx = result.indexOf('<meta http-equiv="Content-Security-Policy"');
    const scriptIdx = result.indexOf('<script>');

    expect(cspIdx).toBeGreaterThan(-1);
    expect(cspIdx).toBeLessThan(scriptIdx);
  });

  it('replaces an existing CSP meta tag', () => {
    const html = [
      '<html>',
      '  <head>',
      '    <meta charset="utf-8">',
      '    <script>window.x = 1;</script>',
      '    <meta http-equiv="Content-Security-Policy" content="default-src *">',
      '  </head>',
      '</html>'
    ].join('\n');

    const result = applyPolicyToHtml(html, policy, 'page.html');

    expect(result).not.toContain('default-src *');
    expect(result.match(/http-equiv="Content-Security-Policy"/g)).toHaveLength(
      1
    );
    expect(
      result.indexOf('<meta http-equiv="Content-Security-Policy"')
    ).toBeLessThan(result.indexOf('<script>'));
  });

  it('rejects inline event-handler attributes with the attribute and file name', () => {
    const html =
      '<html><head><meta charset="utf-8"></head><body onload="init()"></body></html>';

    expect(() =>
      applyPolicyToHtml(html, policy, 'dist/browser/index.html')
    ).toThrow(/onload.*dist\/browser\/index\.html/);
  });

  it('rejects javascript: URLs with the attribute and file name', () => {
    const html =
      '<html><head><meta charset="utf-8"></head><body><a href="javascript:void(0)">x</a></body></html>';

    expect(() =>
      applyPolicyToHtml(html, policy, 'dist/browser/about.html')
    ).toThrow(/href.*dist\/browser\/about\.html/);
  });
});
