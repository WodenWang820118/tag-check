import { inject, LOCALE_ID, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ResolveFn } from '@angular/router';
import { getLocaleConfig } from '../../../locale/locale-routing';
import { MarkdownService } from 'ngx-markdown';
import { firstValueFrom, from, map, Observable } from 'rxjs';

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
const NOT_FOUND_MARKDOWN =
  '# 404 Not Found\n\nThe requested page was not found.';

function buildAssetPath(locale: string, nodeName: string) {
  return `${MARKDOWN_ASSET_ROOT}/${locale}/${nodeName}.md`;
}

function getCandidateLocaleSegments(locale: string): string[] {
  return locale === DEFAULT_DOCS_LOCALE
    ? [DEFAULT_DOCS_LOCALE]
    : [locale, DEFAULT_DOCS_LOCALE];
}

async function readMarkdownFromWorkspace(locale: string, nodeName: string) {
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

  const cwd =
    (globalThis as { process?: { cwd?: () => string } }).process?.cwd?.() ?? '';
  const filePath = pathModule.join(
    cwd,
    ...WORKSPACE_MARKDOWN_ROOT,
    locale,
    `${nodeName}.md`
  );
  return fsPromises.readFile(filePath, 'utf8');
}

async function loadBrowserMarkdown(
  markdownService: MarkdownService,
  localeSegments: string[],
  nodeName: string
) {
  let lastError: unknown;

  for (const locale of localeSegments) {
    const fileName = buildAssetPath(locale, nodeName);

    try {
      const content = await firstValueFrom(markdownService.getSource(fileName));
      if (content) {
        return {
          fileName,
          content
        };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    console.error('Error loading markdown file:', lastError);
  }

  return {
    fileName: '404.md',
    content: NOT_FOUND_MARKDOWN
  };
}

async function loadServerMarkdown(localeSegments: string[], nodeName: string) {
  let lastError: unknown;

  for (const locale of localeSegments) {
    const fileName = buildAssetPath(locale, nodeName);

    try {
      const content = await readMarkdownFromWorkspace(locale, nodeName);
      if (content) {
        return {
          fileName,
          content
        };
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    console.error('Error loading markdown file:', lastError);
  }

  return {
    fileName: '404.md',
    content: NOT_FOUND_MARKDOWN
  };
}

export const treeNodeResolver: ResolveFn<
  Observable<{
    fileName: string;
    content: string;
  }>
> = (route) => {
  const markdownService = inject(MarkdownService);
  const platformId = inject(PLATFORM_ID);
  const locale = getLocaleConfig(inject(LOCALE_ID)).assetSegment;
  const nodeName = route.params['name'];
  const localeSegments = getCandidateLocaleSegments(locale);

  return from(
    isPlatformServer(platformId)
      ? loadServerMarkdown(localeSegments, nodeName)
      : loadBrowserMarkdown(markdownService, localeSegments, nodeName)
  ).pipe(map((result) => result));
};
