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

/**
 * Downloads the template as a UTF-8 CSV file.
 */
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

function detectDelimiter(text: string): string {
  let inQuotes = false;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && (char === '\r' || char === '\n')) {
      const line = text.slice(start, i);
      if (line.trim() !== '') {
        return line.includes(';') && !line.includes(',') ? ';' : ',';
      }
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
      start = i + 1;
    }
  }
  const remaining = text.slice(start);
  return remaining.includes(';') && !remaining.includes(',') ? ';' : ',';
}

/**
 * Splits CSV text into rows of cells according to RFC 4180.
 * Supports quoted cells containing line breaks and doubled quotes.
 * Excel saves with `;` in locales that use a decimal comma, so a header line
 * with `;` and no `,` switches the delimiter. Blank lines are skipped.
 */
export function parseCsvToTable(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(cleanText);

  const rows: string[][] = [];
  let cells: string[] = [];
  let current = '';
  let inQuotes = false;
  let rowHasContent = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];

    if (char === '"') {
      rowHasContent = true;
      if (inQuotes && cleanText[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (inQuotes) {
      rowHasContent = true;
      current += char;
    } else if (char === delimiter) {
      rowHasContent = true;
      cells.push(current);
      current = '';
    } else if (char === '\r' || char === '\n') {
      if (char === '\r' && cleanText[i + 1] === '\n') {
        i++;
      }
      if (rowHasContent) {
        cells.push(current);
        rows.push(cells);
      }
      cells = [];
      current = '';
      rowHasContent = false;
    } else {
      if (char.trim() !== '') {
        rowHasContent = true;
      }
      current += char;
    }
  }

  if (rowHasContent || cells.length > 0) {
    cells.push(current);
    rows.push(cells);
  }

  return rows;
}

/**
 * Reads an uploaded CSV file into rows of cells; see {@link parseCsvToTable}.
 */
export async function readMeasurementPlanFile(file: File): Promise<string[][]> {
  return parseCsvToTable(await file.text());
}
