import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { startStaticServer } from './static-server.ts';
import type { StaticServerHandle } from './static-server.ts';

const tempRoots: string[] = [];
const activeServers: StaticServerHandle[] = [];

afterEach(async () => {
  for (const server of activeServers.splice(0)) {
    await server.close();
  }
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

function rawHttpGet(
  origin: string,
  rawPath: string
): Promise<{ status: number; body: string }> {
  const url = new URL(origin);
  return new Promise((resolveRequest, rejectRequest) => {
    const req = http.request(
      {
        hostname: url.hostname,
        port: Number(url.port),
        path: rawPath,
        method: 'GET'
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          resolveRequest({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf8')
          });
        });
      }
    );
    req.on('error', rejectRequest);
    req.end();
  });
}

describe('startStaticServer', () => {
  it('serves files with expected content types and no CSP header', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tag-check-csp-server-'));
    tempRoots.push(dir);
    mkdirSync(join(dir, 'about'), { recursive: true });
    writeFileSync(join(dir, 'index.html'), '<h1>Home</h1>');
    writeFileSync(join(dir, 'about', 'index.html'), '<h1>About</h1>');
    writeFileSync(join(dir, 'app.mjs'), 'export const x = 1;');
    writeFileSync(join(dir, 'styles.css'), 'body {}');
    writeFileSync(join(dir, 'manifest.webmanifest'), '{}');

    const server = await startStaticServer(dir);
    activeServers.push(server);

    const homeRes = await fetch(`${server.origin}/`);
    expect(homeRes.status).toBe(200);
    expect(homeRes.headers.get('content-type')).toBe(
      'text/html; charset=utf-8'
    );
    expect(homeRes.headers.get('content-security-policy')).toBeNull();
    expect(await homeRes.text()).toBe('<h1>Home</h1>');

    const aboutRes = await fetch(`${server.origin}/about`);
    expect(aboutRes.status).toBe(200);
    expect(aboutRes.headers.get('content-type')).toBe(
      'text/html; charset=utf-8'
    );
    expect(await aboutRes.text()).toBe('<h1>About</h1>');

    const jsRes = await fetch(`${server.origin}/app.mjs`);
    expect(jsRes.status).toBe(200);
    expect(jsRes.headers.get('content-type')).toBe(
      'application/javascript; charset=utf-8'
    );

    const cssRes = await fetch(`${server.origin}/styles.css`);
    expect(cssRes.status).toBe(200);
    expect(cssRes.headers.get('content-type')).toBe('text/css; charset=utf-8');

    const manifestRes = await fetch(`${server.origin}/manifest.webmanifest`);
    expect(manifestRes.status).toBe(200);
    expect(manifestRes.headers.get('content-type')).toBe(
      'application/manifest+json; charset=utf-8'
    );
  });

  it('answers 404 for missing files and path traversal attempts', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tag-check-csp-traversal-'));
    tempRoots.push(dir);
    writeFileSync(join(dir, 'index.html'), '<h1>Home</h1>');

    const server = await startStaticServer(dir);
    activeServers.push(server);

    const missingRes = await fetch(`${server.origin}/does-not-exist.html`);
    expect(missingRes.status).toBe(404);

    const parentTraversal = await rawHttpGet(server.origin, '/../package.json');
    expect(parentTraversal.status).toBe(404);

    const encodedTraversal = await rawHttpGet(
      server.origin,
      '/%2e%2e/package.json'
    );
    expect(encodedTraversal.status).toBe(404);

    const nestedTraversal = await rawHttpGet(
      server.origin,
      '/about/../../package.json'
    );
    expect(nestedTraversal.status).toBe(404);
  });

  it('frees the port when close() resolves', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tag-check-csp-close-'));
    tempRoots.push(dir);
    writeFileSync(join(dir, 'index.html'), '<h1>Home</h1>');

    const server = await startStaticServer(dir);
    const { origin } = server;
    await server.close();

    await expect(fetch(`${origin}/`)).rejects.toThrow();
  });
});
