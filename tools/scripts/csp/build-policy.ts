import { createHash } from 'node:crypto';

import { CSP_DIRECTIVES as DIRECTIVE_ORDER } from './site-policies.ts';
import type { SiteCspPolicy } from './site-policies.ts';

const JAVASCRIPT_MIME_TYPES = new Set([
  'application/ecmascript',
  'application/javascript',
  'application/x-ecmascript',
  'application/x-javascript',
  'text/ecmascript',
  'text/javascript',
  'text/javascript1.0',
  'text/javascript1.1',
  'text/javascript1.2',
  'text/javascript1.3',
  'text/javascript1.4',
  'text/javascript1.5',
  'text/jscript',
  'text/livescript',
  'text/x-ecmascript',
  'text/x-javascript'
]);

interface ParsedAttribute {
  readonly name: string;
  readonly value: string;
}

interface ParsedTag {
  readonly tagName: string;
  readonly start: number;
  readonly end: number;
  readonly attrs: readonly ParsedAttribute[];
  readonly scriptText?: string;
}

function isWhitespace(char: string): boolean {
  return (
    char === ' ' ||
    char === '\t' ||
    char === '\n' ||
    char === '\r' ||
    char === '\f'
  );
}

function findTagEnd(html: string, startIndex: number): number {
  let quote: string | null = null;

  for (let i = startIndex; i < html.length; i += 1) {
    const ch = html[i];
    if (quote !== null) {
      if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '>') {
      return i;
    }
  }

  return -1;
}

function parseAttributes(rawAttrs: string): ParsedAttribute[] {
  const attrs: ParsedAttribute[] = [];
  const len = rawAttrs.length;
  let i = 0;

  while (i < len) {
    while (i < len && isWhitespace(rawAttrs[i])) {
      i += 1;
    }
    if (i >= len) {
      break;
    }
    if (rawAttrs[i] === '/') {
      i += 1;
      continue;
    }

    const nameStart = i;
    while (
      i < len &&
      !isWhitespace(rawAttrs[i]) &&
      rawAttrs[i] !== '=' &&
      rawAttrs[i] !== '/'
    ) {
      i += 1;
    }

    const name = rawAttrs.slice(nameStart, i).toLowerCase();
    if (!name) {
      i += 1;
      continue;
    }

    while (i < len && isWhitespace(rawAttrs[i])) {
      i += 1;
    }

    let value = '';
    if (i < len && rawAttrs[i] === '=') {
      i += 1;
      while (i < len && isWhitespace(rawAttrs[i])) {
        i += 1;
      }

      if (i < len && (rawAttrs[i] === '"' || rawAttrs[i] === "'")) {
        const quote = rawAttrs[i];
        i += 1;
        const valueStart = i;
        while (i < len && rawAttrs[i] !== quote) {
          i += 1;
        }
        value = rawAttrs.slice(valueStart, i);
        if (i < len && rawAttrs[i] === quote) {
          i += 1;
        }
      } else {
        const valueStart = i;
        while (i < len && !isWhitespace(rawAttrs[i])) {
          i += 1;
        }
        value = rawAttrs.slice(valueStart, i);
        if (i === len && value.endsWith('/')) {
          value = value.slice(0, -1);
        }
      }
    }

    attrs.push({ name, value });
  }

  return attrs;
}

function scanRawTextEnd(
  html: string,
  contentStart: number,
  tagName: 'script' | 'style'
): { contentEnd: number; tagEnd: number } {
  const closePattern = new RegExp(`</${tagName}(?=[\\s>])`, 'gi');
  closePattern.lastIndex = contentStart;
  const match = closePattern.exec(html);

  if (!match) {
    return { contentEnd: html.length, tagEnd: html.length };
  }

  const closeGt = html.indexOf('>', match.index + tagName.length + 2);
  return {
    contentEnd: match.index,
    tagEnd: closeGt === -1 ? html.length : closeGt + 1
  };
}

function scanHtmlTags(html: string): ParsedTag[] {
  const tags: ParsedTag[] = [];
  let i = 0;

  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      break;
    }

    if (html.startsWith('<!--', lt)) {
      const commentEnd = html.indexOf('-->', lt + 4);
      i = commentEnd === -1 ? html.length : commentEnd + 3;
      continue;
    }

    const nextChar = html[lt + 1] ?? '';
    if (nextChar === '!' || nextChar === '?') {
      const declEnd = html.indexOf('>', lt + 2);
      i = declEnd === -1 ? html.length : declEnd + 1;
      continue;
    }

    if (nextChar === '/') {
      const closeMatch = /^<\/([a-zA-Z][a-zA-Z0-9:-]*)\s*>/.exec(
        html.slice(lt)
      );
      if (closeMatch) {
        tags.push({
          tagName: `/${closeMatch[1].toLowerCase()}`,
          start: lt,
          end: lt + closeMatch[0].length,
          attrs: []
        });
        i = lt + closeMatch[0].length;
      } else {
        i = lt + 1;
      }
      continue;
    }

    const nameMatch = /^<([a-zA-Z][a-zA-Z0-9:-]*)(?=[\s/>])/.exec(
      html.slice(lt)
    );
    if (!nameMatch) {
      i = lt + 1;
      continue;
    }

    const tagName = nameMatch[1].toLowerCase();
    const attrsStart = lt + 1 + nameMatch[1].length;
    const gt = findTagEnd(html, attrsStart);
    if (gt === -1) {
      i = lt + 1;
      continue;
    }

    const attrs = parseAttributes(html.slice(attrsStart, gt));
    const tagEnd = gt + 1;

    if (tagName === 'script' || tagName === 'style') {
      const rawEnd = scanRawTextEnd(html, tagEnd, tagName);
      tags.push({
        tagName,
        start: lt,
        end: rawEnd.tagEnd,
        attrs,
        scriptText:
          tagName === 'script'
            ? html.slice(tagEnd, rawEnd.contentEnd)
            : undefined
      });
      i = rawEnd.tagEnd;
      continue;
    }

    tags.push({ tagName, start: lt, end: tagEnd, attrs });
    i = tagEnd;
  }

  return tags;
}

function isExecutableScriptType(typeValue: string | undefined): boolean {
  if (typeValue === undefined) {
    return true;
  }

  const normalized = typeValue.split(';', 1)[0].trim().toLowerCase();
  if (normalized === '' || normalized === 'module') {
    return true;
  }

  return JAVASCRIPT_MIME_TYPES.has(normalized);
}

export function inlineScriptHashes(html: string): string[] {
  const hashes: string[] = [];

  for (const tag of scanHtmlTags(html)) {
    if (tag.tagName !== 'script' || tag.scriptText === undefined) {
      continue;
    }

    const hasSrc = tag.attrs.some((attr) => attr.name === 'src');
    if (hasSrc) {
      continue;
    }

    const typeAttr = tag.attrs.find((attr) => attr.name === 'type');
    if (!isExecutableScriptType(typeAttr?.value)) {
      continue;
    }

    // The browser hashes the script text after its HTML parser has turned
    // every CRLF and lone CR into LF, so a file with CRLF line endings must be
    // hashed the same way or its inline scripts are blocked.
    const parsedText = tag.scriptText
      .replaceAll('\r\n', '\n')
      .replaceAll('\r', '\n');
    const digest = createHash('sha256')
      .update(parsedText, 'utf8')
      .digest('base64');
    hashes.push(`'sha256-${digest}'`);
  }

  return hashes;
}

export function serializePolicy(
  policy: SiteCspPolicy,
  hashes: readonly string[] = []
): string {
  const uniqueSortedHashes = policy.hashInlineScripts
    ? [...new Set(hashes)].sort()
    : [];

  const parts: string[] = [];

  for (const directive of DIRECTIVE_ORDER) {
    const baseSources = policy.directives[directive];
    if (
      baseSources === undefined &&
      !(directive === 'script-src' && uniqueSortedHashes.length > 0)
    ) {
      continue;
    }

    const combined =
      directive === 'script-src'
        ? [...(baseSources ?? []), ...uniqueSortedHashes]
        : [...(baseSources ?? [])];
    const deduped = [...new Set(combined)];

    if (deduped.length > 0) {
      parts.push(`${directive} ${deduped.join(' ')}`);
    }
  }

  return parts.join('; ');
}

function assertNoDisallowedConstructs(
  tags: readonly ParsedTag[],
  sourceLabel: string
): void {
  for (const tag of tags) {
    for (const attr of tag.attrs) {
      if (/^on[a-z]+$/.test(attr.name)) {
        throw new Error(
          `Disallowed inline event-handler attribute "${attr.name}" in ${sourceLabel}: inline event handlers cannot be allowed by CSP hashes.`
        );
      }

      // Browsers ignore control characters and spaces inside a URL scheme.
      const normalizedValue = [...attr.value]
        .filter((character) => character > ' ')
        .join('')
        .toLowerCase();
      if (normalizedValue.startsWith('javascript:')) {
        throw new Error(
          `Disallowed javascript: URL in attribute "${attr.name}" in ${sourceLabel}: javascript: URLs are blocked by CSP.`
        );
      }
    }
  }
}

function isCspMetaTag(tag: ParsedTag): boolean {
  if (tag.tagName !== 'meta') {
    return false;
  }

  const httpEquiv = tag.attrs.find((attr) => attr.name === 'http-equiv');
  return httpEquiv?.value.trim().toLowerCase() === 'content-security-policy';
}

function stripExistingCspMetas(
  html: string,
  tags: readonly ParsedTag[]
): string {
  const cspTags = tags.filter(isCspMetaTag);
  if (cspTags.length === 0) {
    return html;
  }

  let result = html;
  for (let idx = cspTags.length - 1; idx >= 0; idx -= 1) {
    const tag = cspTags[idx];
    let removeStart = tag.start;
    let removeEnd = tag.end;

    const lineStart = result.lastIndexOf('\n', tag.start - 1);
    if (lineStart !== -1) {
      const beforeOnLine = result.slice(lineStart + 1, tag.start);
      if (/^[ \t]*$/.test(beforeOnLine)) {
        const prevChar =
          result[lineStart - 1] === '\r' ? lineStart - 1 : lineStart;
        const afterTag = result.slice(tag.end);
        if (/^[ \t]*(?:\r?\n|$)/.test(afterTag)) {
          removeStart = prevChar;
          const trailingSpaces = afterTag.match(/^[ \t]*/)?.[0].length ?? 0;
          removeEnd = tag.end + trailingSpaces;
        }
      }
    }

    result = result.slice(0, removeStart) + result.slice(removeEnd);
  }

  return result;
}

function escapeMetaContent(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

function computeLinePrefix(html: string, anchorIndex: number): string {
  const lastNewline = html.lastIndexOf('\n', anchorIndex - 1);
  if (lastNewline === -1) {
    return '';
  }

  const lineBeforeAnchor = html.slice(lastNewline + 1, anchorIndex);
  const indentMatch = lineBeforeAnchor.match(/^[ \t]*/);
  const indent = indentMatch ? indentMatch[0] : '';
  const lineEnding =
    lastNewline > 0 && html[lastNewline - 1] === '\r' ? '\r\n' : '\n';

  return `${lineEnding}${indent}`;
}

export function applyPolicyToHtml(
  html: string,
  policy: SiteCspPolicy,
  filePath?: string
): string {
  const sourceLabel = filePath ?? 'HTML input';
  const initialTags = scanHtmlTags(html);
  assertNoDisallowedConstructs(initialTags, sourceLabel);

  const hashes = policy.hashInlineScripts ? inlineScriptHashes(html) : [];
  const policyContent = escapeMetaContent(serializePolicy(policy, hashes));
  const metaTag = `<meta http-equiv="Content-Security-Policy" content="${policyContent}">`;

  const cleanedHtml = stripExistingCspMetas(html, initialTags);
  const cleanedTags =
    cleanedHtml === html ? initialTags : scanHtmlTags(cleanedHtml);

  const headOpen = cleanedTags.find((tag) => tag.tagName === 'head');
  if (!headOpen) {
    throw new Error(`Missing <head> element in ${sourceLabel}.`);
  }

  const headClose = cleanedTags.find(
    (tag) => tag.tagName === '/head' && tag.start >= headOpen.end
  );
  const headEndLimit = headClose ? headClose.start : cleanedHtml.length;

  const firstScriptOrStyle = cleanedTags.find(
    (tag) =>
      tag.start >= headOpen.end &&
      tag.start < headEndLimit &&
      (tag.tagName === 'script' ||
        tag.tagName === 'style' ||
        tag.tagName === 'link')
  );

  const charsetMeta = cleanedTags.find(
    (tag) =>
      tag.tagName === 'meta' &&
      tag.start >= headOpen.end &&
      tag.end <= headEndLimit &&
      tag.attrs.some((attr) => attr.name === 'charset')
  );

  if (
    charsetMeta &&
    (!firstScriptOrStyle || charsetMeta.end <= firstScriptOrStyle.start)
  ) {
    const prefix = computeLinePrefix(cleanedHtml, charsetMeta.start);
    return (
      cleanedHtml.slice(0, charsetMeta.end) +
      prefix +
      metaTag +
      cleanedHtml.slice(charsetMeta.end)
    );
  }

  const nextTagInHead = cleanedTags.find(
    (tag) => tag.start >= headOpen.end && tag.start < headEndLimit
  );
  const prefix = nextTagInHead
    ? computeLinePrefix(cleanedHtml, nextTagInHead.start)
    : '';

  return (
    cleanedHtml.slice(0, headOpen.end) +
    prefix +
    metaTag +
    cleanedHtml.slice(headOpen.end)
  );
}
