import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

/* load 'fs' for readFile and writeFile support */
import * as fs from 'fs';
XLSX.set_fs(fs);

/* load 'stream' for stream support */
import { Readable } from 'stream';
XLSX.stream.set_readable(Readable);

@Injectable()
export class XlsxReportService {
  writeXlsxFile(
    filename: string,
    filePath: string,
    sheetName: string,
    data: any[]
  ) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    // TODO: don't know where the file will be saved
    XLSX.writeFile(wb, filePath + filename + '.xlsx', {
      bookType: 'xlsx',
      type: 'buffer',
    });
  }
}
