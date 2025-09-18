import { Injectable } from '@nestjs/common';

@Injectable()
export class XlsxNameService {
  /** Excel worksheet names must be <=31 chars and avoid certain characters. */
  sanitiseWorksheetName(name: string): string {
    const INVALID = new Set([':', '\\', '/', '?', '*', '[', ']']);
    let cleaned = Array.from(name)
      .map((ch) => (INVALID.has(ch) ? ' ' : ch))
      .join('');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= 31) return cleaned;
    return cleaned.slice(0, 15) + '…' + cleaned.slice(-15);
  }
}
