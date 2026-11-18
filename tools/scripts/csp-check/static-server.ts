import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, isAbsolute, join, posix, relative, resolve } from 'node:path';

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

export interface StaticServerHandle {
  origin: string;
  close: () => Promise<void>;
}

function resolveSafePath(rootDir: string, requestUrl: string): string | null {
  const rawPath = requestUrl.split(/[?#]/, 1)[0] ?? '/';

  let decoded: string;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return null;
  }

  if (decoded.includes('\0')) {
    return null;
  }

  const stripped = decoded.replaceAll('\\', '/').replace(/^\/+/, '');
  const normalized = posix.normalize(stripped);
  if (normalized === '..' || normalized.startsWith('../')) {
    return null;
  }

  const candidate = normalized === '.' ? rootDir : resolve(rootDir, normalized);
  const rel = relative(rootDir, candidate);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    return null;
  }

  return candidate;
}

function sendNotFound(res: ServerResponse): void {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
}

async function resolveFileToServe(candidate: string): Promise<string | null> {
  try {
    const info = await stat(candidate);
    if (info.isFile()) {
      return candidate;
    }

    if (info.isDirectory()) {
      const indexFile = join(candidate, 'index.html');
      const indexInfo = await stat(indexFile);
      return indexInfo.isFile() ? indexFile : null;
    }

    return null;
  } catch {
    return null;
  }
}

async function handleRequest(
  rootDir: string,
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendNotFound(res);
    return;
  }

  const candidate = resolveSafePath(rootDir, req.url ?? '/');
  if (!candidate) {
    sendNotFound(res);
    return;
  }

  const filePath = await resolveFileToServe(candidate);
  if (!filePath) {
    sendNotFound(res);
    return;
  }

  const content = await readFile(filePath);
  const contentType =
    CONTENT_TYPES[extname(filePath).toLowerCase()] ??
    'application/octet-stream';

  res.writeHead(200, {
    'Content-Length': content.byteLength,
    'Content-Type': contentType
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  res.end(content);
}

/**
 * Starts a minimal static file server bound to `127.0.0.1` on an ephemeral
 * port. Adds no CSP headers of its own.
 */
export async function startStaticServer(
  rootDirectory: string
): Promise<StaticServerHandle> {
  const rootDir = resolve(rootDirectory);

  const server = createServer((req, res) => {
    void handleRequest(rootDir, req, res).catch(() => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      res.end('Internal Server Error');
    });
  });

  await new Promise<void>((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', rejectListen);
      resolveListen();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Failed to resolve ephemeral port for static server.');
  }

  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolveClose, rejectClose) => {
        server.close((error) => {
          if (error) {
            rejectClose(error);
            return;
          }
          resolveClose();
        });
        server.closeAllConnections();
      })
  };
}
