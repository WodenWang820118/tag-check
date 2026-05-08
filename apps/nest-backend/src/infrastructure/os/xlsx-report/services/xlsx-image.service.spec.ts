import { describe, it, expect } from 'vitest';
import { XlsxImageService } from './xlsx-image.service';

describe('XlsxImageService', () => {
  const svc = new XlsxImageService();

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
