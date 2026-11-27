import {
  extractDataLayerPushes,
  isMeasurementPlanHeader,
  measurementPlanToDataLayerSpecs,
  parseMeasurementPlanRows,
  type StrictDataLayerEvent
} from '@utils';

/**
 * Distinguish invalid from unrecognized input so a recognized format's errors
 * stop fallback parsing.
 */
export type TableImportResult =
  | { kind: 'unrecognized' }
  | { kind: 'invalid'; message: string }
  | { kind: 'ready'; specs: StrictDataLayerEvent[] };

/**
 * Recognize the plan header before validation so invalid plans retain their own
 * diagnostics.
 */
export function parsePlanTable(table: string[][]): TableImportResult {
  if (table.length === 0 || !isMeasurementPlanHeader(table[0])) {
    return { kind: 'unrecognized' };
  }

  const { rows, issues } = parseMeasurementPlanRows(table);

  if (issues.length > 0) {
    return { kind: 'invalid', message: issues.join('\n') };
  }

  if (rows.length === 0) {
    return {
      kind: 'invalid',
      message: 'The uploaded measurement plan contains no event rows.'
    };
  }

  const specs = measurementPlanToDataLayerSpecs(rows);
  return { kind: 'ready', specs };
}

/**
 * Retain spreadsheet row numbers so users can locate malformed embedded pushes.
 */
export function parseLegacySpecsTable(table: string[][]): TableImportResult {
  if (table.length === 0) {
    return { kind: 'unrecognized' };
  }
  const headerRow = table[0];
  const colIndex = headerRow.findIndex(
    (cell) => (cell ?? '').trim().toLowerCase() === 'datalayer specs'
  );
  if (colIndex === -1) {
    return { kind: 'unrecognized' };
  }

  const allSpecs: StrictDataLayerEvent[] = [];
  const allIssues: string[] = [];

  for (let rowIndex = 1; rowIndex < table.length; rowIndex++) {
    const row = table[rowIndex];
    // every() is also true for an empty row.
    if (row.every((cell) => !cell || cell.trim() === '')) {
      continue;
    }
    const cellText = row[colIndex] ?? '';
    const { specs, issues } = extractDataLayerPushes(cellText);
    for (const issue of issues) {
      allIssues.push(`Row ${rowIndex + 1}: ${issue}`);
    }
    allSpecs.push(...specs);
  }

  if (allIssues.length > 0) {
    return { kind: 'invalid', message: allIssues.join('\n') };
  }

  if (allSpecs.length === 0) {
    return {
      kind: 'invalid',
      message:
        'The uploaded sheet contained no dataLayer.push call with an event.'
    };
  }

  return { kind: 'ready', specs: allSpecs };
}
