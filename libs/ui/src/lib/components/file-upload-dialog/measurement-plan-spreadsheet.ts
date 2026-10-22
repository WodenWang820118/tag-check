import { getGa4MeasurementPlanTemplateRows } from '@utils';

/**
 * The measurement plan travels as CSV: Excel and Google Sheets open and save it
 * without conversion, and reading it needs no spreadsheet library in the page.
 */
export const MEASUREMENT_PLAN_TEMPLATE_FILE_NAME =
  'ga4-measurement-plan-template.csv';

const PLAN_HEADER = ['event_name', 'event_parameters', 'item_parameters'];

function toCsvCell(value: string): string {
  return /[",;\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** The template: the plan header and GA4's recommended events, one per row. */
export function buildMeasurementPlanTemplateCsv(): string {
  const rows = getGa4MeasurementPlanTemplateRows().map((row) => [
    row.eventName,
    row.eventParameters.join(', '),
    row.itemParameters.join(', ')
  ]);
  return [PLAN_HEADER, ...rows]
    .map((cells) => cells.map(toCsvCell).join(','))
    .join('\r\n');
}

export function downloadMeasurementPlanTemplate(): void {
  const blob = new Blob([buildMeasurementPlanTemplateCsv()], {
    type: 'text/csv;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = MEASUREMENT_PLAN_TEMPLATE_FILE_NAME;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Splits CSV text into rows of cells. Quoted cells may hold delimiters and
 * doubled quotes. Excel saves with `;` in locales that use a decimal comma, so
 * a header line with `;` and no `,` switches the delimiter.
 */
export function parseCsvToTable(text: string): string[][] {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const header = lines[0] ?? '';
  const delimiter = header.includes(';') && !header.includes(',') ? ';' : ',';

  return lines
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          cells.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current);
      return cells;
    });
}

export async function readMeasurementPlanFile(file: File): Promise<string[][]> {
  return parseCsvToTable(await file.text());
}
