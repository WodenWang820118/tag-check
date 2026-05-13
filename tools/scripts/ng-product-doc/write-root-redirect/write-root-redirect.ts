import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { SUPPORTED_LOCALES } from '../../../../libs/ui/src/lib/locale/locale-routing.ts';
import { isDirectEntrypoint } from '../../shared/paths.ts';

export const DEFAULT_LOCALE_PATH = '/en';
export const DEFAULT_DOCUMENTATION_PATH = '/documentation/introduction';
export const DEFAULT_PRODUCT_DOC_LOCALE_SUBPATHS = SUPPORTED_LOCALES.map(
  ({ urlSegment }) => urlSegment
);

export interface ProductDocRedirectOptions {
  outputDirectory?: string;
  rootRedirectTarget?: string;
  documentationPath?: string;
  localeSubpaths?: readonly string[];
}

export interface ProductDocRedirectWriteResult {
  outputDirectory: string;
  rootIndexFile: string;
  appIndexFile: string;
  localeAppIndexFiles: string[];
}

export function normalizeAbsolutePath(candidate: string): string {
  const trimmed = candidate.trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }

  return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

export function normalizePathSegment(candidate: string): string {
  return candidate.trim().replace(/^\/+/, '').replace(/\/+$/, '');
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function serializeRedirectTargetForScript(target: string): string {
  return JSON.stringify(target)
    .replaceAll('<', '\\u003C')
    .replaceAll('>', '\\u003E')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

export function createRedirectHtml(target: string): string {
  const normalizedTarget = normalizeAbsolutePath(target);
  const escapedTarget = escapeHtml(normalizedTarget);
  const serializedTarget = serializeRedirectTargetForScript(normalizedTarget);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <meta name="robots" content="noindex">
    <meta http-equiv="refresh" content="0; url=${escapedTarget}">
    <link rel="canonical" href="${escapedTarget}">
    <script>
      window.location.replace(${serializedTarget});
    </script>
  </head>
  <body>
    <p>Redirecting to <a href="${escapedTarget}">${escapedTarget}</a>...</p>
  </body>
</html>
`;
}

export function buildLocaleDocumentationTarget(
  localeSubpath: string,
  documentationPath = DEFAULT_DOCUMENTATION_PATH
): string {
  const normalizedLocaleSubpath = normalizePathSegment(localeSubpath);
  const normalizedDocumentationPath = normalizeAbsolutePath(documentationPath);

  if (!normalizedLocaleSubpath) {
    return normalizedDocumentationPath;
  }

  return `/${normalizedLocaleSubpath}${normalizedDocumentationPath}`;
}

export async function writeRedirectFile(
  outputDirectory: string,
  relativeFilePath: string,
  target: string
): Promise<string> {
  const absoluteFilePath = join(outputDirectory, relativeFilePath);

  await mkdir(dirname(absoluteFilePath), { recursive: true });
  await writeFile(absoluteFilePath, createRedirectHtml(target), 'utf8');

  return absoluteFilePath;
}

export async function writeProductDocRedirects(
  options: ProductDocRedirectOptions = {}
): Promise<ProductDocRedirectWriteResult> {
  const outputDirectory = resolve(
    options.outputDirectory ??
      process.env.NG_PRODUCT_DOC_OUTPUT_PATH ??
      'dist/apps/ng-product-doc/browser'
  );
  const rootRedirectTarget = normalizeAbsolutePath(
    options.rootRedirectTarget ??
      process.env.NG_PRODUCT_DOC_ROOT_REDIRECT ??
      DEFAULT_LOCALE_PATH
  );
  const documentationPath =
    options.documentationPath ?? DEFAULT_DOCUMENTATION_PATH;
  const localeSubpaths =
    options.localeSubpaths ?? DEFAULT_PRODUCT_DOC_LOCALE_SUBPATHS;

  const rootIndexFile = await writeRedirectFile(
    outputDirectory,
    'index.html',
    rootRedirectTarget
  );
  const appIndexFile = await writeRedirectFile(
    outputDirectory,
    join('app', 'index.html'),
    buildLocaleDocumentationTarget(rootRedirectTarget, documentationPath)
  );
  const localeAppIndexFiles: string[] = [];

  for (const localeSubpath of localeSubpaths) {
    const normalizedLocaleSubpath = normalizePathSegment(localeSubpath);

    if (!normalizedLocaleSubpath) {
      continue;
    }

    localeAppIndexFiles.push(
      await writeRedirectFile(
        outputDirectory,
        join(normalizedLocaleSubpath, 'app', 'index.html'),
        buildLocaleDocumentationTarget(
          normalizedLocaleSubpath,
          documentationPath
        )
      )
    );
  }

  return {
    outputDirectory,
    rootIndexFile,
    appIndexFile,
    localeAppIndexFiles
  };
}

if (isDirectEntrypoint(import.meta.url)) {
  const result = await writeProductDocRedirects();

  console.log(`Wrote ng-product-doc redirects to ${result.outputDirectory}`);
}
