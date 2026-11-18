import { describe, expect, it } from 'vitest';

import {
  evaluateResults,
  parseCliArgs,
  shortenBlockedUri
} from './check-site-csp.ts';
import type { PageCspResult } from './collect-violations.ts';

describe('parseCliArgs', () => {
  it('parses --dir with defaults', () => {
    expect(parseCliArgs(['--dir', 'dist/apps/ng-product-doc/browser'])).toEqual(
      {
        dir: 'dist/apps/ng-product-doc/browser',
        url: undefined,
        sitemap: '/sitemap.xml',
        blockExternal: false,
        requirePolicy: true,
        maxRoutes: undefined,
        concurrency: 4
      }
    );
  });

  it('parses --url and optional flags', () => {
    expect(
      parseCliArgs([
        '--url=https://preview.example.com/some/path',
        '--sitemap',
        'custom-sitemap.xml',
        '--block-external',
        '--no-require-policy',
        '--max-routes',
        '10',
        '--concurrency=8'
      ])
    ).toEqual({
      dir: undefined,
      url: 'https://preview.example.com',
      sitemap: '/custom-sitemap.xml',
      blockExternal: true,
      requirePolicy: false,
      maxRoutes: 10,
      concurrency: 8
    });
  });

  it('rejects --dir and --url together or neither', () => {
    expect(() =>
      parseCliArgs(['--dir', 'dist', '--url', 'https://example.com'])
    ).toThrow(/exactly one/i);
    expect(() => parseCliArgs([])).toThrow(/exactly one/i);
  });

  it('rejects invalid concurrency or max-routes', () => {
    expect(() => parseCliArgs(['--dir', 'dist', '--concurrency', '9'])).toThrow(
      /at most 8/i
    );
    expect(() => parseCliArgs(['--dir', 'dist', '--max-routes', '0'])).toThrow(
      /at least 1/i
    );
  });
});

describe('shortenBlockedUri', () => {
  it('strips query strings and hashes from URLs', () => {
    expect(
      shortenBlockedUri(
        'https://www.googletagmanager.com/gtm.js?id=GTM-123&token=secret#hash'
      )
    ).toBe('https://www.googletagmanager.com/gtm.js');
    expect(shortenBlockedUri('/assets/app.js?v=123')).toBe('/assets/app.js');
    expect(shortenBlockedUri('inline')).toBe('inline');
  });
});

describe('evaluateResults', () => {
  it('returns exitCode 0 when all pages load, have policy, and have no violations', () => {
    const results: PageCspResult[] = [
      {
        route: '/en/',
        status: 200,
        loadError: null,
        hasPolicy: true,
        violations: []
      },
      {
        route: '/en/about',
        status: 200,
        loadError: null,
        hasPolicy: true,
        violations: []
      }
    ];

    const report = evaluateResults(results, true);
    expect(report.exitCode).toBe(0);
    expect(report.pagesChecked).toBe(2);
    expect(report.pagesWithViolations).toBe(0);
    expect(report.distinctPairs).toEqual([]);
    expect(report.lines).toEqual([
      'Summary: checked=2, violations=0, pairs=none'
    ]);
  });

  it('formats violations without query strings and returns exitCode 1', () => {
    const results: PageCspResult[] = [
      {
        route: '/en/',
        status: 200,
        loadError: null,
        hasPolicy: true,
        violations: [
          {
            source: 'event',
            violatedDirective: 'script-src-elem',
            effectiveDirective: 'script-src-elem',
            blockedURI:
              'https://www.googletagmanager.com/gtm.js?id=GTM-SECRET&auth=xyz',
            sourceFile: 'https://example.com/en/',
            lineNumber: 12,
            disposition: 'enforce'
          }
        ]
      }
    ];

    const report = evaluateResults(results, true);
    expect(report.exitCode).toBe(1);
    expect(report.pagesWithViolations).toBe(1);
    expect(report.distinctPairs).toEqual([
      'script-src-elem → https://www.googletagmanager.com'
    ]);
    expect(report.lines[0]).toBe(
      '[VIOLATION] /en/ | script-src-elem -> https://www.googletagmanager.com/gtm.js'
    );
    expect(report.lines.join('\n')).not.toContain('GTM-SECRET');
    expect(report.lines.join('\n')).not.toContain('?');
    expect(report.lines[1]).toBe(
      'Summary: checked=1, violations=1, pairs=script-src-elem → https://www.googletagmanager.com'
    );
  });

  it('fails when requirePolicy is true and a page has no policy, but passes when false', () => {
    const results: PageCspResult[] = [
      {
        route: '/en/',
        status: 200,
        loadError: null,
        hasPolicy: false,
        violations: []
      }
    ];

    expect(evaluateResults(results, true).exitCode).toBe(1);
    expect(evaluateResults(results, false).exitCode).toBe(0);
  });

  it('fails on load errors', () => {
    const results: PageCspResult[] = [
      {
        route: '/missing',
        status: 404,
        loadError: 'HTTP 404',
        hasPolicy: false,
        violations: []
      }
    ];

    const report = evaluateResults(results, true);
    expect(report.exitCode).toBe(1);
    expect(report.pagesWithLoadErrors).toBe(1);
    expect(report.pagesWithViolations).toBe(0);
  });
});
