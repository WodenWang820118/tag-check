import { type ExtractedMeasurementPlanRow } from '@utils';

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

/** The file name of a plan extracted from a container. */
export const EXTRACTED_MEASUREMENT_PLAN_FILE_NAME =
  'ga4-measurement-plan-from-gtm.csv';

function toCsv(table: readonly string[][]): string {
  return table.map((cells) => cells.map(toCsvCell).join(',')).join('\r\n');
}

/**
 * Template rows demonstrating realistic GA4 events and every parameter rule form:
 * - regex patterns (e.g. transaction_id=/^T\d+$/)
 * - specific literal values (e.g. currency=TWD, method=email)
 * - plain any-value parameters (e.g. value, currency, method)
 */
export const MEASUREMENT_PLAN_TEMPLATE_ROWS: readonly (readonly [
  eventName: string,
  eventParameters: string,
  itemParameters: string
])[] = [
  [
    'purchase',
    'transaction_id=/^T\\d+$/, currency=TWD, value',
    'item_id, item_name, price, quantity'
  ],
  ['sign_up', 'method=email', ''],
  ['view_item', 'currency, value', 'item_id, item_name'],
  ['add_to_cart', 'currency, value', 'item_id, item_name, price, quantity'],
  ['login', 'method', '']
];

/** The template: the plan header and realistic rows showing every rule form. */
export function buildMeasurementPlanTemplateCsv(): string {
  return toCsv([
    PLAN_HEADER,
    ...MEASUREMENT_PLAN_TEMPLATE_ROWS.map((row) => [...row])
  ]);
}

/**
 * A plan extracted from a container, with a `notes` column for what to check.
 * The plan upload reads only the three plan columns, so the file can be
 * uploaded again as it is.
 */
export function buildExtractedMeasurementPlanCsv(
  rows: readonly ExtractedMeasurementPlanRow[]
): string {
  return toCsv([
    [...PLAN_HEADER, 'notes'],
    ...rows.map((row) => [
      row.eventName,
      row.eventParameters.join(', '),
      row.itemParameters.join(', '),
      row.notes.join(' ')
    ])
  ]);
}

/** Downloads CSV text as a UTF-8 file. */
export function downloadCsv(csv: string, fileName: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads the template as a UTF-8 CSV file.
 */
export function downloadMeasurementPlanTemplate(): void {
  downloadCsv(
    buildMeasurementPlanTemplateCsv(),
    MEASUREMENT_PLAN_TEMPLATE_FILE_NAME
  );
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
 * Malformed quotes, duplicate plan headers and inconsistent widths name the
 * physical line so an upload cannot silently lose or misalign records.
 */
export function parseCsvToTable(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(cleanText);

  const rows: string[][] = [];
  let cells: string[] = [];
  let current = '';
  let inQuotes = false;
  let closedQuote = false;
  let rowHasContent = false;
  let line = 1;
  let rowStartLine = 1;
  let quoteStartLine = 1;

  const appendRow = () => {
    if (!rowHasContent) {
      return;
    }
    const row = [...cells, current];
    if (rows.length === 0) {
      const header = row.map((cell) => cell.trim().toLowerCase());
      for (const required of PLAN_HEADER) {
        if (header.filter((cell) => cell === required).length > 1) {
          throw new Error(
            `Line ${rowStartLine}: duplicate required header "${required}".`
          );
        }
      }
    } else if (row.length !== rows[0].length) {
      throw new Error(
        `Line ${rowStartLine}: expected ${rows[0].length} columns but found ${row.length}.`
      );
    }
    rows.push(row);
  };

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];

    if (char === '"') {
      rowHasContent = true;
      if (inQuotes && cleanText[i + 1] === '"') {
        current += '"';
        i++;
      } else if (inQuotes) {
        inQuotes = false;
        closedQuote = true;
      } else {
        if (current !== '' || closedQuote) {
          throw new Error(
            `Line ${line}: unexpected quote in an unquoted cell.`
          );
        }
        inQuotes = true;
        quoteStartLine = line;
      }
    } else if (inQuotes) {
      rowHasContent = true;
      current += char;
      if (char === '\r' || char === '\n') {
        if (char === '\r' && cleanText[i + 1] === '\n') {
          current += '\n';
          i++;
        }
        line++;
      }
    } else if (char === delimiter) {
      rowHasContent = true;
      cells.push(current);
      current = '';
      closedQuote = false;
    } else if (char === '\r' || char === '\n') {
      if (char === '\r' && cleanText[i + 1] === '\n') {
        i++;
      }
      appendRow();
      cells = [];
      current = '';
      closedQuote = false;
      rowHasContent = false;
      line++;
      rowStartLine = line;
    } else {
      if (closedQuote) {
        throw new Error(`Line ${line}: unexpected text after a closing quote.`);
      }
      if (char.trim() !== '') {
        rowHasContent = true;
      }
      current += char;
    }
  }

  if (inQuotes) {
    throw new Error(`Line ${quoteStartLine}: unterminated quoted cell.`);
  }
  appendRow();

  return rows;
}

/**
 * Reads an uploaded CSV file into rows of cells; see {@link parseCsvToTable}.
 */
export async function readMeasurementPlanFile(file: File): Promise<string[][]> {
  return parseCsvToTable(await file.text());
}
