import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class XlsxUtilsService {
  private readonly logger = new Logger(XlsxUtilsService.name);
  formatJsonForExcel(jsonData: any): string {
    try {
      if (Object.keys(jsonData).length === 0) {
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
