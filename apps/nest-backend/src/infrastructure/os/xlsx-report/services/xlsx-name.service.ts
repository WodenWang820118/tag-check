import { Injectable } from '@nestjs/common';

const MAX_SHEET_NAME_LENGTH = 31;

/** Worksheet names that Excel (and exceljs) accept. */
@Injectable()
export class XlsxNameService {
  /**
   * Excel worksheet names must be <= 31 characters, must not contain
   * `: \ / ? * [ ]`, and must not start or end with an apostrophe.
   */
  sanitiseWorksheetName(name: string): string {
    const INVALID = new Set([':', '\\', '/', '?', '*', '[', ']']);
    let cleaned = Array.from(name)
      .map((ch) => (INVALID.has(ch) ? ' ' : ch))
      .join('');
    cleaned = cleaned
      .replaceAll(/\s+/g, ' ')
      .replaceAll(/^'+|'+$/g, '')
      .trim();
    if (!cleaned) return 'Test';
    if (cleaned.length <= MAX_SHEET_NAME_LENGTH) return cleaned;
    return cleaned.slice(0, 15) + '…' + cleaned.slice(-15);
  }

  /**
   * A sanitised name that no sheet in `taken` has yet, suffixed with
   * ` (2)`, ` (3)`… when needed, and adds it to `taken`. Excel compares
   * sheet names case-insensitively and rejects a duplicate, which failed
   * the whole export when two tests' names truncated to the same name.
   *
   * @param taken - Lower-cased names of the workbook's sheets so far.
   */
  uniqueWorksheetName(name: string, taken: Set<string>): string {
    const base = this.sanitiseWorksheetName(name);
    let candidate = base;
    for (let n = 2; taken.has(candidate.toLowerCase()); n++) {
      const suffix = ` (${n})`;
      candidate =
        base.slice(0, MAX_SHEET_NAME_LENGTH - suffix.length).trimEnd() + suffix;
    }
    taken.add(candidate.toLowerCase());
    return candidate;
  }
}
