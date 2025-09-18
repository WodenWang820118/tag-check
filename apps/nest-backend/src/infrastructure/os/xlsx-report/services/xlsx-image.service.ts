import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { FullTestEventResponseDto } from '../../../../shared';

interface ResolvedImage {
  buffer: Buffer;
  extension: 'png' | 'jpeg';
}

@Injectable()
export class XlsxImageService {
  private readonly logger = new Logger(XlsxImageService.name);

  resolveImage(report: FullTestEventResponseDto): ResolvedImage | null {
    if (!report.latestTestImage) return null;
    this.logger.debug(
      `Resolving image for test '${report.latestTestImage.imageName}', imageSize: ${report.latestTestImage.imageSize}`
    );
    const raw: unknown = report.latestTestImage.imageData as unknown;
    if (!raw) return null;
    const buf = this.coerceToBuffer(raw);
    if (!buf) return null;
    const extension = this.detectImageExtension(buf);
    if (!extension) return null;
    return { buffer: buf, extension };
  }

  embedImage(
    workbook: ExcelJS.Workbook,
    worksheet: ExcelJS.Worksheet,
    report: FullTestEventResponseDto
  ) {
    try {
      const resolved = this.resolveImage(report);
      if (!resolved) return;
      const imageId = workbook.addImage({
        buffer: resolved.buffer as unknown as ExcelJS.Buffer,
        extension: resolved.extension
      });
      const lastRowNumber = worksheet.lastRow?.number || 1;

      const summaryRow = this.findRowNumberByFirstCell(
        worksheet,
        'Test Summary'
      );
      const recordingRow = this.findRowNumberByFirstCell(
        worksheet,
        'Recording'
      );

      // We prefer anchoring the image next to the "Recording" row if it exists, otherwise fall back
      // to the summary row, then finally the last row.
      const logicalAnchorRow = recordingRow ?? summaryRow ?? lastRowNumber;

      // Determine the starting column for the image: immediately to the right of the
      // last used column in the anchor row (ideally the Recording row).
      let baseRowForColumnCalc = logicalAnchorRow;
      // If the logical anchor ended up being summary but recording exists (rare ordering), still use recording for width.
      if (recordingRow) baseRowForColumnCalc = recordingRow;
      const lastUsedInAnchorRow = this.findLastUsedColumnInRow(
        worksheet,
        baseRowForColumnCalc
      );
      let imageStartCol = lastUsedInAnchorRow >= 1 ? lastUsedInAnchorRow : 4; // 1-based to 0-based later by ExcelJS

      // Safety: if the calculated start column would overlap existing populated cells (defensive),
      // nudge it one column to the right.
      if (lastUsedInAnchorRow >= 1 && imageStartCol === lastUsedInAnchorRow) {
        imageStartCol = lastUsedInAnchorRow; // lastUsedInAnchorRow is 1-based; ExcelJS image anchor col accepts zero-based; we handle below.
      }
      const { targetWidth, targetHeight, rowsNeeded } = this.computeImageLayout(
        resolved.buffer,
        resolved.extension
      );
      this.ensureRowsForImage(
        worksheet,
        logicalAnchorRow,
        rowsNeeded,
        lastRowNumber
      );
      worksheet.addImage(imageId, {
        // ExcelJS uses 0-based indices for the image anchor.
        tl: { col: imageStartCol, row: logicalAnchorRow - 1 },
        ext: { width: targetWidth, height: targetHeight }
      });
    } catch (e) {
      this.logger.warn(
        `Failed to embed image: ${e instanceof Error ? e.message : e}`
      );
    }
  }

  private computeImageLayout(
    buffer: Buffer,
    extension: 'png' | 'jpeg'
  ): { targetWidth: number; targetHeight: number; rowsNeeded: number } {
    const parsedDims = this.parseImageDimensions(buffer, extension);
    const maxWidthPx = 320;
    const maxHeightPx = 220;
    let targetWidth = parsedDims?.width ?? 300;
    let targetHeight = parsedDims?.height ?? 150;
    const aspect = targetWidth / targetHeight;
    if (targetWidth > maxWidthPx) {
      targetWidth = maxWidthPx;
      targetHeight = Math.round(targetWidth / aspect);
    }
    if (targetHeight > maxHeightPx) {
      targetHeight = maxHeightPx;
      targetWidth = Math.round(targetHeight * aspect);
    }
    const approximateRowHeightPx = 20;
    const rowsNeeded = Math.ceil(targetHeight / approximateRowHeightPx);
    return { targetWidth, targetHeight, rowsNeeded };
  }

  private ensureRowsForImage(
    worksheet: ExcelJS.Worksheet,
    logicalAnchorRow: number,
    rowsNeeded: number,
    lastRowNumber: number
  ): void {
    const bottomRowNeeded = logicalAnchorRow + rowsNeeded - 1;
    if (bottomRowNeeded > lastRowNumber) {
      const rowsToAdd = bottomRowNeeded - lastRowNumber;
      for (let i = 0; i < rowsToAdd; i++) worksheet.addRow([]);
    }
    for (let r = 0; r < rowsNeeded; r++) {
      const row = worksheet.getRow(logicalAnchorRow + r);
      if (!row.height || row.height < 20) row.height = 20;
    }
  }

  private findRowNumberByFirstCell(
    worksheet: ExcelJS.Worksheet,
    text: string
  ): number | undefined {
    const lastRowNumber = worksheet.lastRow?.number || 0;
    for (let r = 1; r <= lastRowNumber; r++) {
      const val = worksheet.getRow(r).getCell(1).value;
      if (val === text) return r;
    }
    return undefined;
  }

  private findLastUsedColumnInRow(
    worksheet: ExcelJS.Worksheet,
    rowNumber: number
  ): number {
    const row = worksheet.getRow(rowNumber);
    // cellCount is usually adequate; as a fallback we can iterate backwards for first non-empty cell.
    let last = row.cellCount;
    if (last === 0) return 0;
    // Verify actual non-empty.
    while (last > 0) {
      const cell = row.getCell(last);
      if (cell?.value !== undefined && cell.value !== null && cell.value !== '')
        break;
      last--;
    }
    return last + 1; // We want the next free column position (1-based). The caller will treat as start col.
  }

  private coerceToBuffer(raw: unknown): Buffer | null {
    if (Buffer.isBuffer(raw)) return raw;
    if (typeof raw === 'string') return this.decodeImageString(raw);
    if (typeof raw === 'object' && raw !== null) {
      const plain = raw as { type?: string; data?: unknown };
      if (plain.type === 'Buffer' && Array.isArray(plain.data)) {
        return Buffer.from(plain.data as number[]);
      }
    }
    return null;
  }
  private decodeImageString(str: string): Buffer | null {
    const trimmed = str.trim();
    const dataUriMatch = /^data:(image\/(png|jpe?g));base64,(.+)$/i.exec(
      trimmed
    );
    if (dataUriMatch) {
      try {
        return Buffer.from(dataUriMatch[3], 'base64');
      } catch {
        return null;
      }
    }
    if (/^[A-Za-z0-9+/=\n\r]+$/.test(trimmed) && trimmed.length % 4 === 0) {
      try {
        return Buffer.from(trimmed, 'base64');
      } catch {
        return null;
      }
    }
    return null;
  }
  private detectImageExtension(buf: Buffer): 'png' | 'jpeg' | null {
    if (
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    )
      return 'png';
    if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpeg';
    return null;
  }
  private parseImageDimensions(
    buf: Buffer,
    ext: 'png' | 'jpeg'
  ): { width: number; height: number } | undefined {
    try {
      return ext === 'png'
        ? this.parsePngDimensions(buf)
        : this.parseJpegDimensions(buf);
    } catch {
      this.logger.debug('Failed to parse image dimensions');
      return undefined;
    }
  }

  private parsePngDimensions(
    buf: Buffer
  ): { width: number; height: number } | undefined {
    if (buf.length < 24) return undefined;
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width > 0 && height > 0) return { width, height };
    return undefined;
  }

  private parseJpegDimensions(
    buf: Buffer
  ): { width: number; height: number } | undefined {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] === 0xff) {
        const marker = buf[i + 1];
        if (marker === 0xc0 || marker === 0xc2) {
          const height = buf.readUInt16BE(i + 5);
          const width = buf.readUInt16BE(i + 7);
          if (width > 0 && height > 0) return { width, height };
          return undefined;
        }
        const blockLength = buf.readUInt16BE(i + 2);
        if (blockLength < 2) return undefined;
        i += 2 + blockLength;
        continue;
      }
      i++;
    }
    return undefined;
  }
  private findMaxColumnInRange(
    worksheet: ExcelJS.Worksheet,
    startRow: number,
    endRow: number
  ): number {
    let maxCol = 0;
    for (let r = startRow; r <= endRow; r++) {
      const row = worksheet.getRow(r);
      const lastCol = row.cellCount;
      if (lastCol > maxCol) maxCol = lastCol;
    }
    return maxCol;
  }
}
