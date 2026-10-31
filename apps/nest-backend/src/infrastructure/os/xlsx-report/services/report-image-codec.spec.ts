import { describe, it, expect } from 'vitest';
import {
  decodeReportImage,
  readReportImageDimensions
} from './report-image-codec';

function createPngBuffer(width: number, height: number): Buffer {
  const buf = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf, 0);
  buf.writeUInt32BE(13, 8);
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  return buf;
}

function createJpegBuffer(
  width: number,
  height: number,
  marker: 0xc0 | 0xc2 = 0xc0
): Buffer {
  const buf = Buffer.alloc(11);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  buf[3] = marker;
  buf.writeUInt16BE(9, 4);
  buf[6] = 8;
  buf.writeUInt16BE(height, 7);
  buf.writeUInt16BE(width, 9);
  return buf;
}

function createJpegWithApp0(width: number, height: number): Buffer {
  const app0 = Buffer.alloc(10);
  app0[0] = 0xff;
  app0[1] = 0xe0;
  app0.writeUInt16BE(8, 2);
  const sof = Buffer.alloc(9);
  sof[0] = 0xff;
  sof[1] = 0xc0;
  sof.writeUInt16BE(7, 2);
  sof[4] = 8;
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof]);
}

describe('report-image-codec', () => {
  describe('decodeReportImage', () => {
    it('preserves Buffer identity for PNG input', () => {
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const result = decodeReportImage(png);
      expect(result).not.toBeNull();
      expect(result?.extension).toBe('png');
      expect(result?.buffer).toBe(png);
    });

    it('preserves Buffer identity for JPEG input', () => {
      const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const result = decodeReportImage(jpeg);
      expect(result).not.toBeNull();
      expect(result?.extension).toBe('jpeg');
      expect(result?.buffer).toBe(jpeg);
    });

    it('decodes JSON Buffer object payloads', () => {
      const bytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      const result = decodeReportImage({ type: 'Buffer', data: bytes });
      expect(result).not.toBeNull();
      expect(result?.extension).toBe('png');
      expect(result?.buffer.equals(Buffer.from(bytes))).toBe(true);
    });

    it('returns null for invalid JSON Buffer representations', () => {
      expect(decodeReportImage({ type: 'NotBuffer', data: [1, 2] })).toBeNull();
      expect(decodeReportImage({ type: 'Buffer', data: 'string' })).toBeNull();
      expect(decodeReportImage({})).toBeNull();
    });

    it('decodes bare base64 strings', () => {
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const base64 = png.toString('base64');
      const result = decodeReportImage(base64);
      expect(result).not.toBeNull();
      expect(result?.extension).toBe('png');
      expect(result?.buffer.equals(png)).toBe(true);
    });

    it('decodes bare base64 with surrounding whitespace', () => {
      const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const base64 = `  ${jpeg.toString('base64')} \n`;
      const result = decodeReportImage(base64);
      expect(result).not.toBeNull();
      expect(result?.extension).toBe('jpeg');
      expect(result?.buffer.equals(jpeg)).toBe(true);
    });

    it('returns null for bare strings that are not valid base64', () => {
      expect(decodeReportImage('abc')).toBeNull();
      expect(decodeReportImage('not-base64-at-all!')).toBeNull();
    });

    it('decodes data URIs for PNG', () => {
      const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const uri = `data:image/png;base64,${png.toString('base64')}`;
      const result = decodeReportImage(uri);
      expect(result).not.toBeNull();
      expect(result?.extension).toBe('png');
      expect(result?.buffer.equals(png)).toBe(true);
    });

    it('decodes data URIs for JPEG and JPG MIME types', () => {
      const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const jpegUri = `data:image/jpeg;base64,${jpeg.toString('base64')}`;
      const jpgUri = `data:image/jpg;base64,${jpeg.toString('base64')}`;

      const resJpeg = decodeReportImage(jpegUri);
      expect(resJpeg?.extension).toBe('jpeg');
      expect(resJpeg?.buffer.equals(jpeg)).toBe(true);

      const resJpg = decodeReportImage(jpgUri);
      expect(resJpg?.extension).toBe('jpeg');
      expect(resJpg?.buffer.equals(jpeg)).toBe(true);
    });

    it('returns null for unsupported data URI MIME types', () => {
      const gif = Buffer.from('GIF89a');
      const uri = `data:image/gif;base64,${gif.toString('base64')}`;
      expect(decodeReportImage(uri)).toBeNull();
    });

    it('returns null for unknown byte signatures', () => {
      expect(decodeReportImage(Buffer.from([1, 2, 3, 4]))).toBeNull();
      expect(decodeReportImage(Buffer.from('GIF89a'))).toBeNull();
      expect(decodeReportImage(Buffer.alloc(0))).toBeNull();
    });

    it('returns null for non-byte non-string input values', () => {
      expect(decodeReportImage(null)).toBeNull();
      expect(decodeReportImage(undefined)).toBeNull();
      expect(decodeReportImage(12345)).toBeNull();
      expect(decodeReportImage(true)).toBeNull();
    });

    it('returns null for truncated signatures', () => {
      const partialPng = Buffer.from([0x89, 0x50, 0x4e]);
      expect(decodeReportImage(partialPng)).toBeNull();
      const partialJpeg = Buffer.from([0xff]);
      expect(decodeReportImage(partialJpeg)).toBeNull();
    });
  });

  describe('readReportImageDimensions', () => {
    it('reads dimensions from a valid PNG header', () => {
      const png = createPngBuffer(640, 480);
      const dims = readReportImageDimensions(png, 'png');
      expect(dims).toEqual({ width: 640, height: 480 });
    });

    it('returns undefined for PNG headers shorter than 24 bytes', () => {
      const shortPng = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
      ]);
      expect(readReportImageDimensions(shortPng, 'png')).toBeUndefined();
      expect(readReportImageDimensions(Buffer.alloc(0), 'png')).toBeUndefined();
    });

    it('returns undefined when PNG width or height is zero', () => {
      const zeroW = createPngBuffer(0, 480);
      expect(readReportImageDimensions(zeroW, 'png')).toBeUndefined();
      const zeroH = createPngBuffer(640, 0);
      expect(readReportImageDimensions(zeroH, 'png')).toBeUndefined();
    });

    it('reads dimensions from JPEG with SOF0 (0xc0) marker', () => {
      const jpeg = createJpegBuffer(800, 400, 0xc0);
      const dims = readReportImageDimensions(jpeg, 'jpeg');
      expect(dims).toEqual({ width: 800, height: 400 });
    });

    it('reads dimensions from JPEG with SOF2 (0xc2) marker', () => {
      const jpeg = createJpegBuffer(300, 600, 0xc2);
      const dims = readReportImageDimensions(jpeg, 'jpeg');
      expect(dims).toEqual({ width: 300, height: 600 });
    });

    it('skips preceding markers to read SOF0 dimensions', () => {
      const jpeg = createJpegWithApp0(1024, 768);
      const dims = readReportImageDimensions(jpeg, 'jpeg');
      expect(dims).toEqual({ width: 1024, height: 768 });
    });

    it('returns undefined for JPEG with no SOF markers', () => {
      const emptyJpeg = Buffer.from([0xff, 0xd8]);
      expect(readReportImageDimensions(emptyJpeg, 'jpeg')).toBeUndefined();
    });

    it('returns undefined when JPEG block length is less than 2', () => {
      const badBlock = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x01]);
      expect(readReportImageDimensions(badBlock, 'jpeg')).toBeUndefined();
    });

    it('returns undefined when JPEG width or height is zero', () => {
      const zeroW = createJpegBuffer(0, 400, 0xc0);
      expect(readReportImageDimensions(zeroW, 'jpeg')).toBeUndefined();
      const zeroH = createJpegBuffer(800, 0, 0xc0);
      expect(readReportImageDimensions(zeroH, 'jpeg')).toBeUndefined();
    });

    it('throws RangeError for truncated JPEG markers exceeding buffer', () => {
      const truncatedMarker = Buffer.from([0xff, 0xd8, 0xff]);
      expect(() => readReportImageDimensions(truncatedMarker, 'jpeg')).toThrow(
        RangeError
      );

      const truncatedSof = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x05]);
      expect(() => readReportImageDimensions(truncatedSof, 'jpeg')).toThrow(
        RangeError
      );
    });
  });
});
