import { describe, it, expect, vi } from 'vitest';
import * as ExcelJS from 'exceljs';
import { XlsxImageService } from './xlsx-image.service';
import type { FullTestEventResponseDto } from '../../../../shared';

function createPngBuffer(width: number, height: number): Buffer {
  const buf = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0);
  buf.writeUInt32BE(13, 8);
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

function buildReport(imageData?: unknown): FullTestEventResponseDto {
  return {
    testName: 't',
    eventName: 'ev',
    latestTestImage: imageData
      ? {
          imageName: 'img.png',
          imageSize: Buffer.isBuffer(imageData) ? imageData.length : 0,
          imageData
        }
      : undefined
  } as unknown as FullTestEventResponseDto;
}

describe('XlsxImageService', () => {
  const svc = new XlsxImageService();

  describe('resolveImage', () => {
    it('returns null when there is no latestTestImage', () => {
      expect(svc.resolveImage({} as never)).toBeNull();
    });

    it('returns null when imageData is missing', () => {
      expect(
        svc.resolveImage({
          latestTestImage: { imageName: 'x', imageSize: 0 }
        } as never)
      ).toBeNull();
    });

    it('decodes a Buffer payload and detects a PNG extension', () => {
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const out = svc.resolveImage({
        latestTestImage: {
          imageName: 'x.png',
          imageSize: png.length,
          imageData: png
        }
      } as never);
      expect(out?.extension).toBe('png');
      expect(out?.buffer.equals(png)).toBe(true);
    });

    it('decodes a JPEG buffer payload', () => {
      const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const out = svc.resolveImage({
        latestTestImage: {
          imageName: 'x.jpg',
          imageSize: jpeg.length,
          imageData: jpeg
        }
      } as never);
      expect(out?.extension).toBe('jpeg');
    });

    it('decodes a base64 data URI string', () => {
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const out = svc.resolveImage({
        latestTestImage: {
          imageName: 'x.png',
          imageSize: 0,
          imageData: `data:image/png;base64,${png.toString('base64')}`
        }
      } as never);
      expect(out?.extension).toBe('png');
    });

    it('decodes the {type:"Buffer", data:[...]} JSON shape', () => {
      const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      const out = svc.resolveImage({
        latestTestImage: {
          imageName: 'x.png',
          imageSize: 0,
          imageData: { type: 'Buffer', data: png }
        }
      } as never);
      expect(out?.extension).toBe('png');
    });

    it('returns null when the bytes are not a recognized image format', () => {
      const out = svc.resolveImage({
        latestTestImage: {
          imageName: 'x.bin',
          imageSize: 4,
          imageData: Buffer.from([1, 2, 3, 4])
        }
      } as never);
      expect(out).toBeNull();
    });
  });

  describe('embedImage', () => {
    it('anchors image to the right of Recording row when present', () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      worksheet.addRow(['Test Summary', 'Summary info']);
      worksheet.addRow(['Recording', 'step 1', 'step 2']);
      worksheet.addRow(['Footer']);

      const addImageSpy = vi.spyOn(worksheet, 'addImage');
      const png = createPngBuffer(800, 400);
      svc.embedImage(workbook, worksheet, buildReport(png));

      expect(addImageSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          tl: { col: 4, row: 1 }
        })
      );
    });

    it('anchors image next to Test Summary when Recording is absent', () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      worksheet.addRow(['Header']);
      worksheet.addRow(['Test Summary', 'Pass']);

      const addImageSpy = vi.spyOn(worksheet, 'addImage');
      const png = createPngBuffer(800, 400);
      svc.embedImage(workbook, worksheet, buildReport(png));

      expect(addImageSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          tl: { col: 3, row: 1 }
        })
      );
    });

    it('anchors image at last row when summary and recording are absent', () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      worksheet.addRow(['Row 1', 'Col B']);
      worksheet.addRow(['Row 2']);

      const addImageSpy = vi.spyOn(worksheet, 'addImage');
      const png = createPngBuffer(800, 400);
      svc.embedImage(workbook, worksheet, buildReport(png));

      expect(addImageSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          tl: { col: 2, row: 1 }
        })
      );
    });

    it('scales wide images down to maxWidthPx keeping aspect ratio', () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      worksheet.addRow(['Recording', 'step']);

      const addImageSpy = vi.spyOn(worksheet, 'addImage');
      // 800 x 400 has aspect ratio 2. Max width 320 -> target height 160.
      const png = createPngBuffer(800, 400);
      svc.embedImage(workbook, worksheet, buildReport(png));

      expect(addImageSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          ext: { width: 320, height: 160 }
        })
      );
      // Rows needed = Math.ceil(160 / 20) = 8 rows.
      for (let r = 1; r <= 8; r++) {
        expect(worksheet.getRow(r).height).toBeGreaterThanOrEqual(20);
      }
    });

    it('scales tall images down to maxHeightPx keeping aspect ratio', () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      worksheet.addRow(['Recording', 'step']);

      const addImageSpy = vi.spyOn(worksheet, 'addImage');
      // 300 x 600 has aspect ratio 0.5. Max height 220 -> target width 110.
      const png = createPngBuffer(300, 600);
      svc.embedImage(workbook, worksheet, buildReport(png));

      expect(addImageSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          ext: { width: 110, height: 220 }
        })
      );
      // Rows needed = Math.ceil(220 / 20) = 11 rows.
      for (let r = 1; r <= 11; r++) {
        expect(worksheet.getRow(r).height).toBeGreaterThanOrEqual(20);
      }
    });

    it('uses fallback dimensions when dimensions are unavailable', () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      worksheet.addRow(['Recording', 'step']);

      const addImageSpy = vi.spyOn(worksheet, 'addImage');
      // Valid PNG signature with length < 24 bytes so dimensions cannot be read.
      const pngSignatureOnly = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
      ]);
      svc.embedImage(workbook, worksheet, buildReport(pngSignatureOnly));

      expect(addImageSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          ext: { width: 300, height: 150 }
        })
      );
      // Rows needed = Math.ceil(150 / 20) = 8 rows.
      for (let r = 1; r <= 8; r++) {
        expect(worksheet.getRow(r).height).toBeGreaterThanOrEqual(20);
      }
    });

    it('retains fallback dimensions when dimension parsing throws', () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      worksheet.addRow(['Recording', 'step']);

      const addImageSpy = vi.spyOn(worksheet, 'addImage');
      // JPEG with SOF0 marker truncated before width/height causes RangeError.
      const malformedJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x05]);
      svc.embedImage(workbook, worksheet, buildReport(malformedJpeg));

      expect(addImageSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          ext: { width: 300, height: 150 }
        })
      );
    });

    it('swallows errors when workbook.addImage fails', () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      vi.spyOn(workbook, 'addImage').mockImplementation(() => {
        throw new Error('Workbook image error');
      });

      const png = createPngBuffer(800, 400);
      expect(() =>
        svc.embedImage(workbook, worksheet, buildReport(png))
      ).not.toThrow();
    });

    it('swallows errors when worksheet.addImage fails', () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      vi.spyOn(worksheet, 'addImage').mockImplementation(() => {
        throw new Error('Worksheet image error');
      });

      const png = createPngBuffer(800, 400);
      expect(() =>
        svc.embedImage(workbook, worksheet, buildReport(png))
      ).not.toThrow();
    });

    it('does nothing when report has no latestTestImage', () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      const spy = vi.spyOn(worksheet, 'addImage');

      svc.embedImage(workbook, worksheet, buildReport());
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
