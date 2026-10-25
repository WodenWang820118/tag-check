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
  getGa4EventNameIssues
} from './ga4-reference';
import type { BaseECommerce, StrictDataLayerEvent } from '../types/tag-check';

/**
 * A single row of a GA4 measurement plan.
 */
export type MeasurementPlanRow = {
  eventName: string;
  eventParameters: string[];
  itemParameters: string[];
};

/**
 * Expected column header names for a measurement plan table (matched case-insensitively).
 */
const HEADER_EVENT_NAME = 'event_name';
const HEADER_EVENT_PARAMETERS = 'event_parameters';
const HEADER_ITEM_PARAMETERS = 'item_parameters';

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

function splitAndDeduplicateParameters(
  cellValue: string | undefined
): string[] {
  if (!cellValue) {
    return [];
  }
  const parts = cellValue.split(',').map((part) => part.trim());
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of parts) {
    if (part.length > 0 && !seen.has(part)) {
      seen.add(part);
      result.push(part);
    }
  }
  return result;
}

function isRowBlank(row: string[]): boolean {
  return row.length === 0 || row.every((cell) => !cell || cell.trim() === '');
}

/**
 * Validates a parameter name against GA4 naming rules and length limit.
 * Parameter names follow the same rules as event names:
 * up to 40 characters, must start with a letter, and contain only letters, numbers, and underscores.
 *
 * @see https://support.google.com/analytics/answer/9267744
 * @see https://support.google.com/analytics/answer/13316687
 */
function getGa4ParameterNameIssues(paramName: string): string[] {
  return getGa4EventNameIssues(paramName);
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
 * Parameter cells are split by comma, trimmed, and deduplicated.
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
    const eventParameters = splitAndDeduplicateParameters(
      rawRow[eventParamsIdx]
    );
    const itemParameters = splitAndDeduplicateParameters(rawRow[itemParamsIdx]);

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
    for (const param of eventParameters) {
      const pIssues = getGa4ParameterNameIssues(param);
      for (const issue of pIssues) {
        issues.push(
          `Row ${rowNumber}: Event parameter "${param}" ${issue} (https://support.google.com/analytics/answer/9267744).`
        );
      }
    }

    // 4. Validate item parameter names
    for (const param of itemParameters) {
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

    rows.push({
      eventName,
      eventParameters,
      itemParameters
    });
  }

  return { rows, issues };
}

/**
 * Converts measurement plan rows into TagCheck dataLayer specs (StrictDataLayerEvent[]).
 * - For events listed in GA4_ECOMMERCE_EVENT_PARAMETERS or rows with item parameters,
 *   event parameters are placed inside the `ecommerce` object.
 * - When item parameters are present, `items: [{ <item param>: '$<item param>' }]` is placed inside `ecommerce`.
 * - A listed `items` event parameter is the items array, not a scalar.
 * - Other events place their parameters at the top level alongside `event`.
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm
 */
export function measurementPlanToDataLayerSpecs(
  rows: readonly MeasurementPlanRow[]
): StrictDataLayerEvent[] {
  const specs: StrictDataLayerEvent[] = [];

  for (const row of rows) {
    const isEcommerce =
      row.eventName in GA4_ECOMMERCE_EVENT_PARAMETERS ||
      row.itemParameters.length > 0;

    if (isEcommerce) {
      const ecommerceObj: Record<string, unknown> = {};

      for (const param of row.eventParameters) {
        if (param === 'items') {
          continue;
        }
        ecommerceObj[param] = `$${param}`;
      }

      if (row.itemParameters.length > 0) {
        const item: Record<string, string> = {};
        for (const itemParam of row.itemParameters) {
          item[itemParam] = `$${itemParam}`;
        }
        ecommerceObj['items'] = [item];
      } else if (row.eventParameters.includes('items')) {
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

      for (const param of row.eventParameters) {
        if (param === 'items') {
          (spec as Record<string, unknown>)['items'] = [];
        } else {
          spec[param] = `$${param}`;
        }
      }

      specs.push(spec);
    }
  }

  return specs;
}
