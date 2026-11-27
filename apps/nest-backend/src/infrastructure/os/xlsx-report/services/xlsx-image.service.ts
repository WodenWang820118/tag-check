import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { FullTestEventResponseDto } from '../../../../shared';
import {
  decodeReportImage,
  readReportImageDimensions
} from './report-image-codec';
import type { DecodedReportImage } from './report-image-codec';

type ResolvedImage = DecodedReportImage;

/**
 * Embeds a test's latest screenshot in its sheet, right of the summary and
 * recording sections.
 */
@Injectable()
export class XlsxImageService {
  private readonly logger = new Logger(XlsxImageService.name);

  /**
   * Use byte signatures because stored image names do not establish the
   * actual format.
   */
  resolveImage(report: FullTestEventResponseDto): ResolvedImage | null {
    if (!report.latestTestImage) return null;
    this.logger.debug(
      `Resolving image for test '${report.latestTestImage.imageName}', ` +
        `imageSize: ${report.latestTestImage.imageSize}`
    );
    const raw: unknown = report.latestTestImage.imageData as unknown;
    if (!raw) return null;
    return decodeReportImage(raw);
  }

  /**
   * Keep image failures nonfatal so the tabular report remains exportable.
   */
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

      // We prefer anchoring the image next to the "Recording" row if it
      // exists, otherwise fall back to the summary row, then finally the
      // last row.
      const logicalAnchorRow = recordingRow ?? summaryRow ?? lastRowNumber;

      // Determine the starting column for the image: immediately to the right
      // of the last used column in the anchor row (ideally the Recording row).
      let baseRowForColumnCalc = logicalAnchorRow;
      // If the logical anchor ended up being summary but recording exists
      // (rare ordering), still use recording for width.
      if (recordingRow) baseRowForColumnCalc = recordingRow;
      const lastUsedInAnchorRow = this.findLastUsedColumnInRow(
        worksheet,
        baseRowForColumnCalc
      );
      // The last used column is 1-based and an image anchor's column is
      // 0-based, so the same number places the image just right of it.
      const imageStartCol = lastUsedInAnchorRow >= 1 ? lastUsedInAnchorRow : 4;
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
    // cellCount is usually adequate; as a fallback we can iterate backwards
    // for first non-empty cell.
    let last = row.cellCount;
    if (last === 0) return 0;
    // Verify actual non-empty.
    while (last > 0) {
      const cell = row.getCell(last);
      if (
        cell?.value !== undefined &&
        cell.value !== null &&
        cell.value !== ''
      ) {
        break;
      }
      last--;
    }
    // We want the next free column position (1-based). The caller will treat
    // as start col.
    return last + 1;
  }

  private parseImageDimensions(
    buf: Buffer,
    ext: 'png' | 'jpeg'
  ): { width: number; height: number } | undefined {
    try {
      return readReportImageDimensions(buf, ext);
    } catch {
      this.logger.debug('Failed to parse image dimensions');
      return undefined;
    }
  }
}
