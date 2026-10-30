/**
 * Generates copyable dataLayer push code snippets for developers from GA4 specs.
 * Links recommended events to Google's official documentation and includes rule comments.
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm
 * @see https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm
 */

import {
  GA4_ECOMMERCE_EVENT_PARAMETERS,
  GA4_NUMERIC_ITEM_PARAMETERS
} from './ga4-reference';
import type { StrictDataLayerEvent } from '../types/tag-check';

/**
 * A generated developer code snippet for a single event.
 */
export interface DeveloperSnippet {
  readonly eventName: string;
  readonly snippet: string;
}

/**
 * Official reference base URL for GA4 recommended events.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm
 */
export const GA4_RECOMMENDED_EVENTS_DOCS_URL =
  'https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm';

/**
 * Recommended non-ecommerce GA4 events documented by Google.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm
 */
const GA4_RECOMMENDED_NON_ECOMMERCE_EVENTS = new Set([
  'earn_virtual_currency',
  'generate_lead',
  'join_group',
  'level_end',
  'level_start',
  'level_up',
  'login',
  'post_score',
  'search',
  'select_content',
  'share',
  'sign_up',
  'spend_virtual_currency',
  'tutorial_begin',
  'tutorial_complete',
  'unlock_achievement',
  'view_search_results'
]);

/**
 * Known GA4 numeric parameters (event-level or item-level).
 */
const GA4_NUMERIC_PARAMETERS = new Set([
  ...GA4_NUMERIC_ITEM_PARAMETERS,
  'value',
  'shipping',
  'tax',
  'item_list_index'
]);

/**
 * Regular expression pattern format `/pattern/` with optional flags.
 */
const REGEX_LITERAL_PATTERN = /^\/.*\/[a-z]*$/;

/**
 * Returns Google's official documentation reference URL with event anchor if
 * the event is a recommended GA4 event, or null for custom events.
 */
export function getGa4EventReferenceUrl(eventName: string): string | null {
  if (
    Object.hasOwn(GA4_ECOMMERCE_EVENT_PARAMETERS, eventName) ||
    GA4_RECOMMENDED_NON_ECOMMERCE_EVENTS.has(eventName)
  ) {
    return `${GA4_RECOMMENDED_EVENTS_DOCS_URL}#${eventName}`;
  }
  return null;
}

/**
 * Checks whether an event is considered an ecommerce event.
 * Ecommerce events clear the previous ecommerce object before pushing new data.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm
 */
export function isEcommerceEvent(spec: StrictDataLayerEvent): boolean {
  if (spec.ecommerce !== undefined && spec.ecommerce !== null) {
    return true;
  }
  return Object.hasOwn(GA4_ECOMMERCE_EVENT_PARAMETERS, spec.event);
}

function isNumericParameter(name: string): boolean {
  return GA4_NUMERIC_PARAMETERS.has(name);
}

function choosePlaceholderValue(name: string, rawSpecValue: unknown): unknown {
  if (name === 'currency') {
    return 'USD';
  }
  if (name === 'transaction_id') {
    return 'T12345';
  }
  if (name === 'item_id') {
    return 'SKU_123';
  }
  if (name === 'item_name') {
    return 'Example';
  }
  if (isNumericParameter(name)) {
    return 0;
  }
  if (
    typeof rawSpecValue === 'string' &&
    REGEX_LITERAL_PATTERN.test(rawSpecValue)
  ) {
    if (rawSpecValue.includes('\\d') || rawSpecValue.includes('T')) {
      return 'T12345';
    }
  }
  return 'example';
}

interface PropertyLineDescriptor {
  readonly codePart: string;
  readonly comment?: string;
}

function parsePropertyDescriptor(
  key: string,
  rawSpecValue: unknown,
  isLast: boolean,
  indent: string
): PropertyLineDescriptor {
  const comma = isLast ? '' : ',';

  // 1. Regex pattern rule: /pattern/flags
  if (
    typeof rawSpecValue === 'string' &&
    REGEX_LITERAL_PATTERN.test(rawSpecValue)
  ) {
    const placeholder = choosePlaceholderValue(key, rawSpecValue);
    const valueStr =
      typeof placeholder === 'number' ? `${placeholder}` : `'${placeholder}'`;
    return {
      codePart: `${indent}${key}: ${valueStr}${comma}`,
      comment: `must match ${rawSpecValue}`
    };
  }

  // 2. Any value rule: $name or empty string
  if (
    rawSpecValue === undefined ||
    (typeof rawSpecValue === 'string' &&
      (rawSpecValue.startsWith('$') || rawSpecValue === ''))
  ) {
    const placeholder = choosePlaceholderValue(key, rawSpecValue);
    const valueStr =
      typeof placeholder === 'number' ? `${placeholder}` : `'${placeholder}'`;
    return {
      codePart: `${indent}${key}: ${valueStr}${comma}`,
      comment: 'any value'
    };
  }

  // 3. Literal value rule
  if (typeof rawSpecValue === 'number') {
    return {
      codePart: `${indent}${key}: ${rawSpecValue}${comma}`,
      comment: `must be ${rawSpecValue}`
    };
  }

  if (typeof rawSpecValue === 'boolean') {
    return {
      codePart: `${indent}${key}: ${rawSpecValue}${comma}`,
      comment: `must be ${rawSpecValue}`
    };
  }

  if (rawSpecValue === null) {
    return {
      codePart: `${indent}${key}: null${comma}`,
      comment: 'must be null'
    };
  }

  const strVal = String(rawSpecValue);
  return {
    codePart: `${indent}${key}: '${strVal}'${comma}`,
    comment: `must be "${strVal}"`
  };
}

/**
 * The items line of a snippet: one example item, with a placeholder for every
 * parameter, and the item rules as a comment (`item_id must match /^SKU-/`).
 */
function formatItemsArray(items: unknown[]): {
  code: string;
  comment?: string;
} {
  const firstItem = items[0];
  if (typeof firstItem !== 'object' || firstItem === null) {
    return { code: 'items: []' };
  }
  const itemObj = firstItem as Record<string, unknown>;
  const keys = Object.keys(itemObj);
  if (keys.length === 0) {
    return { code: 'items: [{}]' };
  }

  const rules: string[] = [];
  const parts = keys.map((key) => {
    const rawVal = itemObj[key];
    if (typeof rawVal === 'string' && REGEX_LITERAL_PATTERN.test(rawVal)) {
      rules.push(`${key} must match ${rawVal}`);
      const ph = choosePlaceholderValue(key, rawVal);
      return typeof ph === 'number' ? `${key}: ${ph}` : `${key}: '${ph}'`;
    }
    if (
      rawVal === undefined ||
      (typeof rawVal === 'string' && (rawVal.startsWith('$') || rawVal === ''))
    ) {
      const ph = choosePlaceholderValue(key, rawVal);
      return typeof ph === 'number' ? `${key}: ${ph}` : `${key}: '${ph}'`;
    }
    if (typeof rawVal === 'number' || typeof rawVal === 'boolean') {
      rules.push(`${key} must be ${rawVal}`);
      return `${key}: ${rawVal}`;
    }
    rules.push(`${key} must be "${String(rawVal)}"`);
    return `${key}: '${String(rawVal)}'`;
  });

  return {
    code: `items: [{ ${parts.join(', ')} }]`,
    ...(rules.length > 0 ? { comment: rules.join('; ') } : {})
  };
}

/** Lines longer than this keep their comment right after the code. */
const COMMENT_ALIGN_MAX = 40;

function renderAlignedProperties(
  descriptors: readonly PropertyLineDescriptor[]
): string[] {
  const commented = descriptors.filter((d) => d.comment !== undefined);
  if (commented.length === 0) {
    return descriptors.map((d) => d.codePart);
  }

  // Align comments across the short lines only: a long line, such as the
  // items line, would push every comment off the right edge of the dialog.
  const alignable = commented.filter(
    (d) => d.codePart.length <= COMMENT_ALIGN_MAX
  );
  const maxCodeLen = Math.max(0, ...alignable.map((d) => d.codePart.length));

  return descriptors.map((d) => {
    if (!d.comment) {
      return d.codePart;
    }
    const padded =
      d.codePart.length <= COMMENT_ALIGN_MAX
        ? d.codePart.padEnd(maxCodeLen, ' ')
        : d.codePart;
    return `${padded} // ${d.comment}`;
  });
}

function buildEcommerceLines(
  ecommerceObj: Record<string, unknown>,
  indent: string
): string[] {
  const entries = Object.entries(ecommerceObj);
  const descriptors: PropertyLineDescriptor[] = [];

  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    const isLast = i === entries.length - 1;

    if (key === 'items' && Array.isArray(value)) {
      const itemsLine = formatItemsArray(value);
      const comma = isLast ? '' : ',';
      descriptors.push({
        codePart: `${indent}${itemsLine.code}${comma}`,
        ...(itemsLine.comment ? { comment: itemsLine.comment } : {})
      });
    } else {
      descriptors.push(parsePropertyDescriptor(key, value, isLast, indent));
    }
  }

  return renderAlignedProperties(descriptors);
}

/**
 * Builds a single JavaScript code snippet for a dataLayer event.
 *
 * @param spec The dataLayer event specification.
 * @returns A formatted JavaScript code snippet string.
 */
export function buildDeveloperSnippet(spec: StrictDataLayerEvent): string {
  const refUrl = getGa4EventReferenceUrl(spec.event);
  const headerComment = refUrl
    ? `// ${spec.event}: ${refUrl}`
    : `// ${spec.event}`;

  const isEcommerce = isEcommerceEvent(spec);
  const lines: string[] = [headerComment];

  lines.push('window.dataLayer = window.dataLayer || [];');
  if (isEcommerce) {
    lines.push(
      'window.dataLayer.push({ ecommerce: null }); // clear the previous ecommerce object'
    );
  }

  lines.push('window.dataLayer.push({');

  if (isEcommerce) {
    const rawEcommerce = (spec.ecommerce ?? {}) as Record<string, unknown>;
    const ecommerceKeys = Object.keys(rawEcommerce);

    if (ecommerceKeys.length === 0) {
      lines.push(`  event: '${spec.event}',`);
      lines.push('  ecommerce: {}');
    } else {
      lines.push(`  event: '${spec.event}',`);
      lines.push('  ecommerce: {');
      const innerLines = buildEcommerceLines(rawEcommerce, '    ');
      lines.push(...innerLines);
      lines.push('  }');
    }
  } else {
    // Non-ecommerce event
    const otherKeys = Object.keys(spec).filter(
      (k) => k !== 'event' && k !== 'ecommerce'
    );

    if (otherKeys.length === 0) {
      lines.push(`  event: '${spec.event}'`);
    } else {
      lines.push(`  event: '${spec.event}',`);
      const descriptors: PropertyLineDescriptor[] = [];
      for (let i = 0; i < otherKeys.length; i++) {
        const key = otherKeys[i];
        const isLast = i === otherKeys.length - 1;
        const val = (spec as Record<string, unknown>)[key];
        descriptors.push(parsePropertyDescriptor(key, val, isLast, '  '));
      }
      lines.push(...renderAlignedProperties(descriptors));
    }
  }

  lines.push('});');
  return lines.join('\n');
}

/**
 * Builds copyable JavaScript snippets for all events in the provided specs.
 *
 * @param specs An array of dataLayer event specifications.
 * @returns An array of {@link DeveloperSnippet} objects.
 */
export function buildDeveloperSnippets(
  specs: readonly StrictDataLayerEvent[]
): DeveloperSnippet[] {
  return specs.map((spec) => ({
    eventName: spec.event,
    snippet: buildDeveloperSnippet(spec)
  }));
}

export const generateDeveloperSnippet = buildDeveloperSnippet;
export const generateDeveloperSnippets = buildDeveloperSnippets;

/**
 * Formats all snippets into a single combined JavaScript file string.
 */
export function formatAllDeveloperSnippets(
  specsOrSnippets: readonly StrictDataLayerEvent[] | readonly DeveloperSnippet[]
): string {
  if (specsOrSnippets.length === 0) {
    return '';
  }
  if ('snippet' in specsOrSnippets[0]) {
    const snippets = specsOrSnippets as readonly DeveloperSnippet[];
    return snippets.map((s) => s.snippet).join('\n\n');
  }
  const specs = specsOrSnippets as readonly StrictDataLayerEvent[];
  return buildDeveloperSnippets(specs)
    .map((s) => s.snippet)
    .join('\n\n');
}
