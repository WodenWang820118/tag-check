export type ReportImageExtension = 'png' | 'jpeg';

export interface DecodedReportImage {
  buffer: Buffer;
  extension: ReportImageExtension;
}

export interface ReportImageDimensions {
  width: number;
  height: number;
}

function decodeImageString(str: string): Buffer | null {
  const trimmed = str.trim();
  const dataUriMatch = /^data:(image\/(png|jpe?g));base64,(.+)$/i.exec(trimmed);
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

function coerceToBuffer(raw: unknown): Buffer | null {
  if (Buffer.isBuffer(raw)) return raw;
  if (typeof raw === 'string') return decodeImageString(raw);
  if (typeof raw === 'object' && raw !== null) {
    const plain = raw as { type?: string; data?: unknown };
    if (plain.type === 'Buffer' && Array.isArray(plain.data)) {
      return Buffer.from(plain.data as number[]);
    }
  }
  return null;
}

function detectImageExtension(buf: Buffer): ReportImageExtension | null {
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'png';
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpeg';
  return null;
}

/**
 * Accept stored and exported byte representations so older reports retain
 * their screenshots.
 */
export function decodeReportImage(raw: unknown): DecodedReportImage | null {
  const buf = coerceToBuffer(raw);
  if (!buf) return null;
  const extension = detectImageExtension(buf);
  if (!extension) return null;
  return { buffer: buf, extension };
}

function parsePngDimensions(buf: Buffer): ReportImageDimensions | undefined {
  if (buf.length < 24) return undefined;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width > 0 && height > 0) return { width, height };
  return undefined;
}

function parseJpegDimensions(buf: Buffer): ReportImageDimensions | undefined {
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

/**
 * Read headers without decoding pixels so export needs no image-processing
 * runtime.
 */
export function readReportImageDimensions(
  buffer: Buffer,
  extension: ReportImageExtension
): ReportImageDimensions | undefined {
  return extension === 'png'
    ? parsePngDimensions(buffer)
    : parseJpegDimensions(buffer);
}
