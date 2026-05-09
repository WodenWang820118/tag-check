import { describe, expect, it, vi } from 'vitest';
import { ProjectImageService } from './project-image.service';

describe('ProjectImageService', () => {
  it('delegates readImage to ImageService with the same arguments', async () => {
    const imageService = {
      readImage: vi.fn().mockResolvedValue({ imageData: Buffer.from('x') })
    };
    const service = new ProjectImageService(imageService as never);
    const result = await service.readImage('proj', 'evt');
    expect(imageService.readImage).toHaveBeenCalledWith('proj', 'evt');
    expect(result).toEqual({ imageData: Buffer.from('x') });
  });
});
