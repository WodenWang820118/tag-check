import { inject, LOCALE_ID, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { getLocaleConfig } from '../../../locale/locale-routing';
import { MarkdownService } from 'ngx-markdown';
import { firstValueFrom, from, Observable, of } from 'rxjs';
import { DOCUMENTATION_ROUTE_SLUGS } from '../tree-data';

/** A documentation page's markdown and the asset path it came from. */
type DocumentationMarkdown = {
  fileName: string;
  content: string;
};

const MARKDOWN_ASSET_ROOT = 'assets/markdown';
const WORKSPACE_MARKDOWN_ROOT = [
  'libs',
  'utils',
  'src',
  'lib',
  'assets',
  'markdown'
];
const DEFAULT_DOCS_LOCALE = 'en';
const NOT_FOUND: DocumentationMarkdown = {
  fileName: '404.md',
  content: '# 404 Not Found\n\nThe requested page was not found.'
};

function buildAssetPath(locale: string, nodeName: string) {
  return `${MARKDOWN_ASSET_ROOT}/${locale}/${nodeName}.md`;
}

/** The page's locale first, then English for pages not translated yet. */
function getCandidateLocaleSegments(locale: string): string[] {
  return locale === DEFAULT_DOCS_LOCALE
    ? [DEFAULT_DOCS_LOCALE]
    : [locale, DEFAULT_DOCS_LOCALE];
}

async function readMarkdownFromWorkspace(locale: string, nodeName: string) {
  // The server bundle reaches Node's built-ins through the process object, so
  // the browser bundle never imports them.
  const processRef = (
    globalThis as {
      process?: {
        cwd?: () => string;
        getBuiltinModule?: (id: string) => unknown;
      };
    }
  ).process;
  const fsPromises = processRef?.getBuiltinModule?.('fs/promises') as
    | { readFile(path: string, encoding: string): Promise<string> }
    | undefined;
  const pathModule = processRef?.getBuiltinModule?.('path') as
    | { join(...paths: string[]): string }
    | undefined;

  if (!fsPromises || !pathModule) {
    throw new Error(
      'Node built-in modules are unavailable during server rendering.'
    );
  }

  const filePath = pathModule.join(
    processRef?.cwd?.() ?? '',
    ...WORKSPACE_MARKDOWN_ROOT,
    locale,
    `${nodeName}.md`
  );
  return fsPromises.readFile(filePath, 'utf8');
}

/**
 * Returns the first non-empty markdown `read` finds for the locales in
 * order, or the inline 404 page when none is found.
 */
async function loadMarkdown(
  localeSegments: string[],
  nodeName: string,
  read: (locale: string) => Promise<string>
): Promise<DocumentationMarkdown> {
  let lastError: unknown;

  for (const locale of localeSegments) {
    try {
      const content = await read(locale);
      if (content) {
        return { fileName: buildAssetPath(locale, nodeName), content };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    console.error('Error loading markdown file:', lastError);
  }
  return NOT_FOUND;
}

/**
 * Resolves the `:name` documentation route to its markdown in the build's
 * locale, falling back to English and then to an inline 404 page. Only the
 * pages listed in the sidebar are loaded: the name becomes part of a file
 * path, which the server reads from disk.
 */
export const treeNodeResolver = ((
  route: ActivatedRouteSnapshot
): Observable<DocumentationMarkdown> => {
  const markdownService = inject(MarkdownService);
  const platformId = inject(PLATFORM_ID);
  const locale = getLocaleConfig(inject(LOCALE_ID)).assetSegment;
  const nodeName: unknown = route.params['name'];

  if (
    typeof nodeName !== 'string' ||
    !DOCUMENTATION_ROUTE_SLUGS.includes(nodeName)
  ) {
    return of(NOT_FOUND);
  }

  const localeSegments = getCandidateLocaleSegments(locale);
  return from(
    isPlatformServer(platformId)
      ? loadMarkdown(localeSegments, nodeName, (segment) =>
          readMarkdownFromWorkspace(segment, nodeName)
        )
      : loadMarkdown(localeSegments, nodeName, (segment) =>
          firstValueFrom(
            markdownService.getSource(buildAssetPath(segment, nodeName))
          )
        )
  );
}) satisfies ResolveFn<DocumentationMarkdown>;
