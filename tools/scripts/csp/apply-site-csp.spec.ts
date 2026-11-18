import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const CLI_PATH = resolve('tools/scripts/csp/apply-site-csp.ts');
const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'tag-check-csp-'));
  tempDirs.push(dir);
  return dir;
}

function runCli(args: readonly string[]) {
  return spawnSync(process.execPath, [CLI_PATH, ...args], {
    encoding: 'utf8'
  });
}

describe('apply-site-csp CLI', () => {
  it('rewrites every HTML file in nested directories and prints a summary', () => {
    const root = createTempDir();
    const nested = join(root, 'zh-hant', 'documentation');
    mkdirSync(nested, { recursive: true });

    const rootHtml =
      '<!doctype html><html><head><meta charset="utf-8"><script>const a = 1;</script></head><body></body></html>';
    const nestedHtml =
      '<!doctype html><html><head><meta charset="utf-8"><script>const b = 2;</script></head><body></body></html>';

    writeFileSync(join(root, 'index.html'), rootHtml, 'utf8');
    writeFileSync(join(nested, 'index.html'), nestedHtml, 'utf8');

    const result = runCli(['--site', 'ng-product-doc', '--dir', root]);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toMatch(
      /^Applied CSP for ng-product-doc: 2 pages, 2 distinct inline-script hashes$/
    );

    expect(readFileSync(join(root, 'index.html'), 'utf8')).toContain(
      '<meta http-equiv="Content-Security-Policy"'
    );
    expect(readFileSync(join(nested, 'index.html'), 'utf8')).toContain(
      '<meta http-equiv="Content-Security-Policy"'
    );
  });

  it('exits non-zero for an unknown site', () => {
    const root = createTempDir();
    writeFileSync(
      join(root, 'index.html'),
      '<html><head></head></html>',
      'utf8'
    );

    const result = runCli(['--site', 'unknown-site', '--dir', root]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Unknown site/);
  });

  it('exits non-zero for a missing directory', () => {
    const missing = join(tmpdir(), 'tag-check-csp-does-not-exist-99999');

    const result = runCli(['--site', 'ng-product-doc', '--dir', missing]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/does not exist/);
  });

  it('exits non-zero when no HTML files are found', () => {
    const root = createTempDir();
    writeFileSync(join(root, 'robots.txt'), 'User-agent: *\n', 'utf8');

    const result = runCli(['--site', 'ng-product-doc', '--dir', root]);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/No HTML files found/);
  });
});
