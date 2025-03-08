import { Injectable } from '@nestjs/common';

@Injectable()
export class XlsxUtilsService {
  formatJsonForExcel(jsonData: any): string {
    try {
      if (Object.keys(jsonData).length === 0) {
        return '{}';
      }
      return JSON.stringify(jsonData, null, 2);
    } catch (e) {
      return String(jsonData);
    }
  }
}
