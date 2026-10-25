import type { StrictDataLayerEvent } from '../types/tag-check';
import { isStrictDataLayerEvent } from './tag-build-contract';

/** A JSON number literal, which an unquoted value may already be. */
const JSON_NUMBER = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

/**
 * Repairs lightly malformed JSON text commonly found in legacy GTM specs and
 * spreadsheets, where specs are written as JavaScript object literals:
 * - strips `//` and `/* *\/` comments outside string literals
 * - converts single-quoted keys and string values to double-quoted
 * - wraps unquoted property names with double quotes
 * - wraps unquoted values with double quotes, except numbers, `true`,
 *   `false` and `null`
 * - removes trailing commas before `}` and `]`
 *
 * The result is not guaranteed to be valid JSON: callers still parse it and
 * report the error. Unquoted values that contain spaces are not repaired.
 */
export function fixJsonString(inputString: string): string {
  let fixedString = stripComments(inputString);

  // Convert single-quoted JSON keys and string values without
  // rewriting apostrophes inside already double-quoted content.
  fixedString = fixedString.replaceAll(/([{,]\s*)'([^']+)'(\s*:)/g, '$1"$2"$3');
  fixedString = fixedString.replaceAll(
    /(:\s*)'([^']*)'(?=\s*[,}\]])/g,
    '$1"$2"'
  );

  // Wrap unquoted property names with double quotes
  fixedString = fixedString.replaceAll(
    /([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g,
    '$1"$2"$3'
  );

  // Wrap unquoted values with double quotes; literals JSON already accepts
  // keep their type, so `value: 19.99` stays a number.
  fixedString = fixedString.replaceAll(
    /(:\s*)([^"{}[\],\s]+)(?=\s*[,\]}])/g,
    (match, prefix: string, value: string) =>
      ['true', 'false', 'null'].includes(value) || JSON_NUMBER.test(value)
        ? match
        : `${prefix}"${value}"`
  );

  // Remove any trailing commas
  return fixedString.replaceAll(/,\s*([\]}])/g, '$1');
}

/**
 * Removes `//` and `/* *\/` comments, leaving string literals untouched so a
 * URL such as `'https://example.com'` keeps its `//`. A line comment's
 * newline is kept.
 */
function stripComments(text: string): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    const end = skipLiteralOrComment(text, i);
    if (end === i) {
      result += text[i];
      i++;
    } else {
      // A comment starts with `/`; anything else skipped is a string literal.
      if (text[i] !== '/') {
        result += text.slice(i, end);
      }
      i = end;
    }
  }
  return result;
}

const PUSH_CALL = /(?:window\s*\.\s*)?dataLayer\s*\.\s*push\s*\(/y;

/**
 * Returns the index just after the string literal or comment that starts at
 * `i`, or `i` itself when none starts there.
 */
function skipLiteralOrComment(text: string, i: number): number {
  const char = text[i];
  const next = text[i + 1];
  if (char === '/' && next === '/') {
    const end = text.indexOf('\n', i);
    return end === -1 ? text.length : end;
  }
  if (char === '/' && next === '*') {
    const end = text.indexOf('*/', i + 2);
    return end === -1 ? text.length : end + 2;
  }
  if (char === "'" || char === '"' || char === '`') {
    let j = i + 1;
    while (j < text.length && text[j] !== char) {
      j += text[j] === '\\' ? 2 : 1;
    }
    return Math.min(j + 1, text.length);
  }
  return i;
}

/**
 * Returns the index of the `)` that closes a call whose argument starts at
 * `start`, or -1 when the call is not closed.
 */
function findClosingParen(text: string, start: number): number {
  let depth = 0;
  let i = start;
  while (i < text.length) {
    const skipped = skipLiteralOrComment(text, i);
    if (skipped !== i) {
      i = skipped;
      continue;
    }
    const char = text[i];
    if (char === '(' || char === '{' || char === '[') {
      depth++;
    } else if (char === ')' || char === '}' || char === ']') {
      if (depth === 0) {
        return char === ')' ? i : -1;
      }
      depth--;
    }
    i++;
  }
  return -1;
}

function parsePushArgument(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return JSON.parse(fixJsonString(raw));
  }
}

/**
 * Finds every `dataLayer.push(` call (with or without `window.`) outside
 * string literals and comments, parses its argument (repairing single quotes,
 * unquoted keys, comments and trailing commas) and keeps the objects that
 * have a string `event`. Pushes without one, such as `{ ecommerce: null }`,
 * are skipped; arguments that cannot be parsed become issues.
 */
export function extractDataLayerPushes(text: string): {
  specs: StrictDataLayerEvent[];
  issues: string[];
} {
  const specs: StrictDataLayerEvent[] = [];
  const issues: string[] = [];
  let i = 0;

  while (i < text.length) {
    const skipped = skipLiteralOrComment(text, i);
    if (skipped !== i) {
      i = skipped;
      continue;
    }
    PUSH_CALL.lastIndex = i;
    if (!PUSH_CALL.test(text)) {
      i++;
      continue;
    }

    const argumentStart = PUSH_CALL.lastIndex;
    const close = findClosingParen(text, argumentStart);
    if (close === -1) {
      issues.push('Unclosed dataLayer.push(...) call.');
      break;
    }
    const raw = text.slice(argumentStart, close).trim();
    i = close + 1;
    if (raw === '') {
      continue;
    }

    try {
      const parsed = parsePushArgument(raw);
      for (const item of Array.isArray(parsed) ? parsed : [parsed]) {
        if (isStrictDataLayerEvent(item)) {
          specs.push(item);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      issues.push(`Failed to parse dataLayer.push argument: ${message}`);
    }
  }

  return { specs, issues };
}
