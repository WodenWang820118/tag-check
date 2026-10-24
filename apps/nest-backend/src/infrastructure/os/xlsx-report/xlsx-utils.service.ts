import { Injectable, Logger } from '@nestjs/common';

/** Formats values for spreadsheet cells. */
@Injectable()
export class XlsxUtilsService {
  private readonly logger = new Logger(XlsxUtilsService.name);
  formatJsonForExcel(jsonData: unknown): string {
    try {
      // Object.keys throws on null/undefined; the catch falls back to String().
      if (Object.keys(jsonData as object).length === 0) {
        return '{}';
      }
      return JSON.stringify(jsonData, null, 2);
    } catch (e) {
      this.logger.warn(
        'Failed to format JSON for Excel',
        JSON.stringify(e, null, 2)
      );
      return String(jsonData);
    }
  }
}
