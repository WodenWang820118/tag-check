/**
 * Google Analytics 4 measurement plan types, parsing and conversion functions.
 * Transcribed from Google's official documentation.
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm
 * @see https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm
 * @see https://support.google.com/analytics/answer/9267744
 * @see https://support.google.com/analytics/answer/13316687
 */

import {
  GA4_ECOMMERCE_EVENT_PARAMETERS,
  getGa4EventNameIssues,
  getGa4ParameterNameIssues
} from './ga4-reference';
import type { BaseECommerce, StrictDataLayerEvent } from '../types/tag-check';

/**
 * The kind of rule to apply to a parameter in TagCheck data layer validation.
 * - `any`: the parameter only needs to exist (any value);
 * - `equals`: the parameter value must strictly equal the literal string, number, or boolean;
 * - `pattern`: the parameter value must match the regular expression pattern.
 */
export type ParameterRuleKind = 'any' | 'equals' | 'pattern';

/** Rule specifying that a parameter must exist, regardless of its value. */
export type AnyParameterRule = {
  kind: 'any';
  name: string;
};

/** Rule specifying that a parameter must strictly equal a literal string, number, or boolean. */
export type EqualsParameterRule = {
  kind: 'equals';
  name: string;
  value: string | number | boolean;
};

/** Rule specifying that a parameter must match a regular expression. */
export type PatternParameterRule = {
  kind: 'pattern';
  name: string;
  pattern: string;
  flags?: string;
};

/** A validation rule for an event parameter or item parameter. */
export type ParameterRule =
  | AnyParameterRule
  | EqualsParameterRule
  | PatternParameterRule;

/**
 * A single row of a GA4 measurement plan.
 * Kept backward-compatible with string arrays while optionally carrying parsed rules.
 */
export type MeasurementPlanRow = {
  eventName: string;
  eventParameters: string[];
  itemParameters: string[];
  eventRules?: ParameterRule[];
  itemRules?: ParameterRule[];
};

/**
 * Expected column header names for a measurement plan table (matched case-insensitively).
 */
const HEADER_EVENT_NAME = 'event_name';
const HEADER_EVENT_PARAMETERS = 'event_parameters';
const HEADER_ITEM_PARAMETERS = 'item_parameters';

/** GTM uses `event` to name the data layer event, so it cannot also hold a parameter. */
const EVENT_PARAMETER_CONFLICT =
  'Event parameter "event" conflicts with the data layer event name; rename the parameter (https://developers.google.com/tag-platform/tag-manager/datalayer).';

/**
 * Maximum number of event parameters allowed per GA4 event (Google: https://support.google.com/analytics/answer/9267744).
 */
export const GA4_MAX_EVENT_PARAMETERS_PER_EVENT = 25;

/**
 * Common GA4 item parameters transcribed from Google's recommended ecommerce events reference.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm
 */
const COMMON_ITEM_PARAMETERS: readonly string[] = [
  'item_id',
  'item_name',
  'item_brand',
  'item_category',
  'item_variant',
  'price',
  'quantity'
];

/**
 * The template's pre-filled rows, built from Google's recommended events reference:
 * - every event in GA4_ECOMMERCE_EVENT_PARAMETERS with its documented event parameters (excluding items)
 *   and the common item parameters (item_id, item_name, item_brand, item_category, item_variant, price, quantity)
 * - login (method)
 * - sign_up (method)
 * - search (search_term)
 * - share (method, content_type, item_id)
 * - select_content (content_type, content_id)
 * - generate_lead (currency, value, lead_source)
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm
 * @see https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm
 */
export function getGa4MeasurementPlanTemplateRows(): MeasurementPlanRow[] {
  return [
    ...Object.entries(GA4_ECOMMERCE_EVENT_PARAMETERS).map(
      ([eventName, params]) => ({
        eventName,
        eventParameters: params.filter((p) => p !== 'items'),
        itemParameters: [...COMMON_ITEM_PARAMETERS]
      })
    ),
    {
      eventName: 'login',
      eventParameters: ['method'],
      itemParameters: []
    },
    {
      eventName: 'sign_up',
      eventParameters: ['method'],
      itemParameters: []
    },
    {
      eventName: 'search',
      eventParameters: ['search_term'],
      itemParameters: []
    },
    {
      eventName: 'share',
      eventParameters: ['method', 'content_type', 'item_id'],
      itemParameters: []
    },
    {
      eventName: 'select_content',
      eventParameters: ['content_type', 'content_id'],
      itemParameters: []
    },
    {
      eventName: 'generate_lead',
      eventParameters: ['currency', 'value', 'lead_source'],
      itemParameters: []
    }
  ];
}

/**
 * Parses a parameter cell entry into a {@link ParameterRule}.
 * Supported syntaxes:
 * - `currency`: required to exist with any value (`any`);
 * - `currency=TWD`: specific value (`equals`);
 *   - `value=10`: number 10;
 *   - `in_stock=true`: boolean true;
 *   - `level="10"`: quoted string forced;
 * - `transaction_id=/^T\d+$/`: regular expression, optionally with flags (`/abc/i`).
 */
export function parseParameterRule(entry: string): {
  rule?: ParameterRule;
  issue?: string;
} {
  const trimmed = entry.trim();
  const equalIndex = trimmed.indexOf('=');

  if (equalIndex === -1) {
    if (trimmed.length === 0) {
      return { issue: 'Parameter entry cannot be empty' };
    }
    return { rule: { kind: 'any', name: trimmed } };
  }

  const name = trimmed.slice(0, equalIndex).trim();
  const rawValue = trimmed.slice(equalIndex + 1).trim();

  if (name.length === 0) {
    return { issue: `Missing parameter name before "=" in "${entry}"` };
  }

  // Quoted string: force string literal
  if (
    rawValue.length >= 2 &&
    rawValue.startsWith('"') &&
    rawValue.endsWith('"')
  ) {
    const stringVal = rawValue.slice(1, -1);
    return { rule: { kind: 'equals', name, value: stringVal } };
  }

  // Regular expression pattern: /pattern/flags
  if (rawValue.startsWith('/')) {
    const lastSlash = rawValue.lastIndexOf('/');
    if (lastSlash <= 0) {
      return {
        issue: `Unterminated regular expression pattern in "${entry}"`
      };
    }
    const pattern = rawValue.slice(1, lastSlash);
    const flags = rawValue.slice(lastSlash + 1);

    try {
      new RegExp(pattern, flags);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        issue: `Invalid regular expression "${rawValue}" for parameter "${name}": ${message}`
      };
    }

    return {
      rule: {
        kind: 'pattern',
        name,
        pattern,
        ...(flags.length > 0 ? { flags } : {})
      }
    };
  }

  // Boolean
  if (rawValue === 'true') {
    return { rule: { kind: 'equals', name, value: true } };
  }
  if (rawValue === 'false') {
    return { rule: { kind: 'equals', name, value: false } };
  }

  // Number: must match finite decimal or integer representation
  if (/^-?\d+(?:\.\d+)?$/.test(rawValue)) {
    const num = Number(rawValue);
    if (!Number.isNaN(num)) {
      return { rule: { kind: 'equals', name, value: num } };
    }
  }

  // Unquoted string
  return { rule: { kind: 'equals', name, value: rawValue } };
}

/**
 * Formats a {@link ParameterRule} in measurement plan cell syntax.
 * - `any`: `name`
 * - `equals`: `name=value` (quotes strings that look like numbers, booleans, or start with /)
 * - `pattern`: `name=/pattern/flags`
 */
export function formatParameterRuleInPlanSyntax(rule: ParameterRule): string {
  if (rule.kind === 'any') {
    return rule.name;
  }
  if (rule.kind === 'pattern') {
    return `${rule.name}=/${rule.pattern}/${rule.flags ?? ''}`;
  }
  if (typeof rule.value === 'string') {
    const isAmbiguous =
      rule.value === 'true' ||
      rule.value === 'false' ||
      /^-?\d+(?:\.\d+)?$/.test(rule.value) ||
      rule.value.startsWith('/');
    return isAmbiguous
      ? `${rule.name}="${rule.value}"`
      : `${rule.name}=${rule.value}`;
  }
  return `${rule.name}=${String(rule.value)}`;
}

/**
 * Splits a parameter cell by comma, respecting unescaped `/.../` regular expression bodies
 * and quoted strings `"..."` so commas inside them are not treated as delimiters.
 */
export function splitParameterCell(cellValue: string | undefined): string[] {
  if (!cellValue) {
    return [];
  }
  const parts: string[] = [];
  let current = '';
  let inRegex = false;
  let inQuotes = false;
  let i = 0;

  while (i < cellValue.length) {
    const char = cellValue[i];

    if (inQuotes) {
      current += char;
      if (char === '\\' && i + 1 < cellValue.length) {
        current += cellValue[i + 1];
        i += 2;
        continue;
      }
      if (char === '"') {
        inQuotes = false;
      }
      i++;
      continue;
    }

    if (inRegex) {
      current += char;
      if (char === '\\' && i + 1 < cellValue.length) {
        current += cellValue[i + 1];
        i += 2;
        continue;
      }
      if (char === '/') {
        inRegex = false;
        i++;
        while (i < cellValue.length && /[a-z]/i.test(cellValue[i])) {
          current += cellValue[i];
          i++;
        }
        continue;
      }
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      current += char;
      i++;
      continue;
    }

    if (char === '/') {
      inRegex = true;
      current += char;
      i++;
      continue;
    }

    if (char === ',') {
      parts.push(current.trim());
      current = '';
      i++;
      continue;
    }

    current += char;
    i++;
  }

  const trimmed = current.trim();
  if (trimmed.length > 0 || parts.length > 0) {
    parts.push(trimmed);
  }

  return parts;
}

function processParameterCell(
  cellValue: string | undefined,
  rowNumber: number,
  kind: 'Event' | 'Item'
): { parts: string[]; rules: ParameterRule[]; issues: string[] } {
  const rawParts = splitParameterCell(cellValue);
  const parts: string[] = [];
  const rules: ParameterRule[] = [];
  const issues: string[] = [];
  const seen = new Set<string>();

  for (const rawPart of rawParts) {
    if (rawPart.length === 0) {
      continue;
    }
    const { rule, issue } = parseParameterRule(rawPart);
    if (issue) {
      issues.push(
        `Row ${rowNumber}: ${kind} parameter "${rawPart}" has an invalid regular expression: ${issue}.`
      );
      continue;
    }
    if (!rule) {
      continue;
    }
    if (seen.has(rule.name)) {
      continue;
    }
    seen.add(rule.name);
    parts.push(rawPart);
    rules.push(rule);
  }

  return { parts, rules, issues };
}

function isRowBlank(row: string[]): boolean {
  return row.length === 0 || row.every((cell) => !cell || cell.trim() === '');
}

/**
 * Checks whether a header row contains the three required measurement plan columns
 * (event_name, event_parameters, item_parameters) matched case-insensitively in any order.
 */
export function isMeasurementPlanHeader(
  headerRow: readonly string[] | undefined
): boolean {
  if (!headerRow || headerRow.length === 0) {
    return false;
  }
  const normalized = headerRow.map((col) => col.trim().toLowerCase());
  return (
    normalized.includes(HEADER_EVENT_NAME) &&
    normalized.includes(HEADER_EVENT_PARAMETERS) &&
    normalized.includes(HEADER_ITEM_PARAMETERS)
  );
}

/**
 * Parses a 2D table of strings into measurement plan rows, reporting any issues.
 * The first row is the header (match event_name, event_parameters, item_parameters case-insensitively, in any order).
 * Blank rows are skipped.
 * Parameter cells are split by comma (respecting regex bodies), trimmed, and deduplicated.
 */
export function parseMeasurementPlanRows(table: string[][]): {
  rows: MeasurementPlanRow[];
  issues: string[];
} {
  const issues: string[] = [];

  if (table.length === 0 || !isMeasurementPlanHeader(table[0])) {
    issues.push(
      'Missing header row. The first row must include event_name, event_parameters, and item_parameters.'
    );
    return { rows: [], issues };
  }

  const headerRow = table[0];
  const normalizedHeader = headerRow.map((col) => col.trim().toLowerCase());
  const eventNameIdx = normalizedHeader.indexOf(HEADER_EVENT_NAME);
  const eventParamsIdx = normalizedHeader.indexOf(HEADER_EVENT_PARAMETERS);
  const itemParamsIdx = normalizedHeader.indexOf(HEADER_ITEM_PARAMETERS);

  const rows: MeasurementPlanRow[] = [];
  const seenEventNames = new Set<string>();

  for (let rowIndex = 1; rowIndex < table.length; rowIndex++) {
    const rawRow = table[rowIndex];
    if (isRowBlank(rawRow)) {
      continue;
    }

    const rowNumber = rowIndex + 1;
    const eventName = (rawRow[eventNameIdx] ?? '').trim();

    const eventProcessed = processParameterCell(
      rawRow[eventParamsIdx],
      rowNumber,
      'Event'
    );
    const itemProcessed = processParameterCell(
      rawRow[itemParamsIdx],
      rowNumber,
      'Item'
    );

    issues.push(...eventProcessed.issues, ...itemProcessed.issues);

    const eventParameters = eventProcessed.parts;
    const itemParameters = itemProcessed.parts;
    const eventRules = eventProcessed.rules;
    const itemRules = itemProcessed.rules;

    const eventParamNames = eventRules.map((r) => r.name);
    const itemParamNames = itemRules.map((r) => r.name);

    if (eventParamNames.includes('event')) {
      issues.push(`Row ${rowNumber}: ${EVENT_PARAMETER_CONFLICT}`);
      continue;
    }

    // 1. Validate event name
    const nameIssues = getGa4EventNameIssues(eventName);
    for (const issue of nameIssues) {
      issues.push(`Row ${rowNumber}: Event name "${eventName}" ${issue}.`);
    }

    // 2. Duplicate event name check
    if (eventName.length > 0) {
      if (seenEventNames.has(eventName)) {
        issues.push(`Row ${rowNumber}: Duplicate event name "${eventName}".`);
      } else {
        seenEventNames.add(eventName);
      }
    }

    // 3. Validate event parameter names
    for (const param of eventParamNames) {
      const pIssues = getGa4ParameterNameIssues(param);
      for (const issue of pIssues) {
        issues.push(
          `Row ${rowNumber}: Event parameter "${param}" ${issue} (https://support.google.com/analytics/answer/9267744).`
        );
      }
    }

    // 4. Validate item parameter names
    for (const param of itemParamNames) {
      const pIssues = getGa4ParameterNameIssues(param);
      for (const issue of pIssues) {
        issues.push(
          `Row ${rowNumber}: Item parameter "${param}" ${issue} (https://support.google.com/analytics/answer/9267744).`
        );
      }
    }

    // 5. Maximum 25 event parameters per event
    if (eventParameters.length > GA4_MAX_EVENT_PARAMETERS_PER_EVENT) {
      issues.push(
        `Row ${rowNumber}: Event "${eventName}" has ${eventParameters.length} event parameters, exceeding the maximum of 25 (https://support.google.com/analytics/answer/9267744).`
      );
    }

    const hasCustomRules =
      eventRules.some((r) => r.kind !== 'any') ||
      itemRules.some((r) => r.kind !== 'any');

    rows.push({
      eventName,
      eventParameters,
      itemParameters,
      ...(hasCustomRules ? { eventRules, itemRules } : {})
    });
  }

  return { rows, issues };
}

function resolveEventRules(row: MeasurementPlanRow): ParameterRule[] {
  if (row.eventRules && row.eventRules.length > 0) {
    return row.eventRules;
  }
  return row.eventParameters.map(
    (param) => parseParameterRule(param).rule ?? { kind: 'any', name: param }
  );
}

function resolveItemRules(row: MeasurementPlanRow): ParameterRule[] {
  if (row.itemRules && row.itemRules.length > 0) {
    return row.itemRules;
  }
  return row.itemParameters.map(
    (param) => parseParameterRule(param).rule ?? { kind: 'any', name: param }
  );
}

function ruleToSpecValue(rule: ParameterRule): unknown {
  if (rule.kind === 'equals') {
    return rule.value;
  }
  if (rule.kind === 'pattern') {
    return rule.flags ? `/${rule.pattern}/${rule.flags}` : `/${rule.pattern}/`;
  }
  return rule.name.startsWith('$') ? rule.name : `$${rule.name}`;
}

/**
 * Converts measurement plan rows into TagCheck dataLayer specs (StrictDataLayerEvent[]).
 * - For events listed in GA4_ECOMMERCE_EVENT_PARAMETERS or rows with item parameters,
 *   event parameters are placed inside the `ecommerce` object.
 * - When item parameters are present, `items: [{ <item param>: '<value>' }]` is placed inside `ecommerce`.
 * - A listed `items` event parameter is the items array, not a scalar.
 * - Other events place their parameters at the top level alongside `event`.
 * - Parameter rules are evaluated into spec expectations:
 *   - `any`: `"$name"`
 *   - `equals`: literal string, number, or boolean
 *   - `pattern`: `"/pattern/flags"`
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm
 */
export function measurementPlanToDataLayerSpecs(
  rows: readonly MeasurementPlanRow[]
): StrictDataLayerEvent[] {
  const specs: StrictDataLayerEvent[] = [];

  for (const row of rows) {
    const eventRules = resolveEventRules(row);
    const itemRules = resolveItemRules(row);

    if (eventRules.some((r) => r.name === 'event')) {
      throw new Error(`Event "${row.eventName}": ${EVENT_PARAMETER_CONFLICT}`);
    }

    const isEcommerce =
      Object.hasOwn(GA4_ECOMMERCE_EVENT_PARAMETERS, row.eventName) ||
      itemRules.length > 0 ||
      row.itemParameters.length > 0;

    if (isEcommerce) {
      const ecommerceObj: Record<string, unknown> = {};

      for (const rule of eventRules) {
        if (rule.name === 'items') {
          continue;
        }
        ecommerceObj[rule.name] = ruleToSpecValue(rule);
      }

      if (itemRules.length > 0) {
        const item: Record<string, unknown> = {};
        for (const itemRule of itemRules) {
          item[itemRule.name] = ruleToSpecValue(itemRule);
        }
        ecommerceObj['items'] = [item];
      } else if (eventRules.some((r) => r.name === 'items')) {
        ecommerceObj['items'] = [];
      }

      specs.push({
        event: row.eventName,
        ecommerce: ecommerceObj as BaseECommerce
      });
    } else {
      const spec: StrictDataLayerEvent = {
        event: row.eventName
      };

      for (const rule of eventRules) {
        if (rule.name === 'items') {
          (spec as Record<string, unknown>)['items'] = [];
        } else {
          // A rule's value may be a boolean, which the spec type omits.
          (spec as Record<string, unknown>)[rule.name] = ruleToSpecValue(rule);
        }
      }

      specs.push(spec);
    }
  }

  return specs;
}
