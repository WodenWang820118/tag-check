import { NotFoundException, StreamableFile } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ImageService } from './image.service';

function build() {
  const testImageRepositoryService = { getBySlugAndEventId: vi.fn() };
  return {
    service: new ImageService(testImageRepositoryService as never),
    testImageRepositoryService
  };
}

describe('ImageService', () => {
  it('throws NotFound when the image cannot be located', async () => {
    const ctx = build();
    ctx.testImageRepositoryService.getBySlugAndEventId.mockResolvedValue(null);
    await expect(
      ctx.service.readImage('demo', 'evt-name#1')
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns a StreamableFile wrapping the image buffer when found', async () => {
    const ctx = build();
    ctx.testImageRepositoryService.getBySlugAndEventId.mockResolvedValue({
      imageData: Buffer.from('PNG-DATA')
    });
    const result = await ctx.service.readImage('demo', 'evt-name#1');
    expect(result).toBeInstanceOf(StreamableFile);
  });
});
