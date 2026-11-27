import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The root vercel.json applies to every Vercel site of this repository
 * (tools/scripts/vercel/preview-targets). Page policies live in each page's
 * <meta> (site-policies.ts); the header carries only what a <meta> cannot.
 */
const VERCEL_JSON_PATH = fileURLToPath(
  new URL('../../../vercel.json', import.meta.url)
);

/** Vercel's documented pattern for "a wildcard that matches all routes". */
const CATCH_ALL_SOURCE = '/(.*)';

interface HeaderEntry {
  readonly key: string;
  readonly value: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isHeaderEntry(value: unknown): value is HeaderEntry {
  return (
    isRecord(value) &&
    typeof value['key'] === 'string' &&
    typeof value['value'] === 'string'
  );
}

function readCatchAllHeaders(): Map<string, string> {
  const config: unknown = JSON.parse(readFileSync(VERCEL_JSON_PATH, 'utf8'));
  if (!isRecord(config) || !Array.isArray(config['headers'])) {
    throw new Error('vercel.json has no headers array.');
  }

  const rule = config['headers'].find(
    (candidate: unknown) =>
      isRecord(candidate) && candidate['source'] === CATCH_ALL_SOURCE
  );
  if (!isRecord(rule) || !Array.isArray(rule['headers'])) {
    throw new Error(
      `vercel.json has no headers rule for "${CATCH_ALL_SOURCE}".`
    );
  }

  const headers = new Map<string, string>();
  for (const entry of rule['headers']) {
    if (!isHeaderEntry(entry)) {
      throw new Error('Each vercel.json header needs a string key and value.');
    }
    headers.set(entry.key.toLowerCase(), entry.value);
  }
  return headers;
}

describe('root vercel.json headers', () => {
  const headers = readCatchAllHeaders();

  it('sends the shared security headers on every path', () => {
    expect([...headers.keys()].sort()).toEqual(
      expect.arrayContaining([
        'content-security-policy',
        'permissions-policy',
        'referrer-policy',
        'x-content-type-options'
      ])
    );
    expect(headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('keeps fetch directives out of the header CSP, which would intersect with each page policy', () => {
    const directives = (headers.get('content-security-policy') ?? '')
      .split(';')
      .map((directive) => directive.trim())
      .filter((directive) => directive !== '');

    expect(directives).toHaveLength(1);
    expect(directives[0]).toMatch(/^frame-ancestors\s/);
  });

  it('lets Storybook frame its own preview (iframe.html is same-origin)', () => {
    expect(headers.get('content-security-policy')).toBe(
      "frame-ancestors 'self'"
    );
  });

  it('keeps the referrer origin that GA4 referral attribution reads', () => {
    expect(headers.get('referrer-policy')).toBe(
      'strict-origin-when-cross-origin'
    );
  });

  it('does not deny features the YouTube embed or the apps use', () => {
    const denied = (headers.get('permissions-policy') ?? '')
      .split(',')
      .map((entry) => entry.trim().split('=', 1)[0] ?? '');

    for (const feature of [
      'accelerometer',
      'autoplay',
      'clipboard-write',
      'encrypted-media',
      'fullscreen',
      'gyroscope',
      'picture-in-picture',
      'web-share'
    ]) {
      expect(denied).not.toContain(feature);
    }
  });
});
