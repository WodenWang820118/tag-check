import { HEADERS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';
import { VideosController } from './videos.controller';

describe('VideosController', () => {
  it('delegates getVideos to ProjectVideoService with the route params', async () => {
    const projectVideoService = {
      getVideos: vi.fn().mockResolvedValue('video-stream')
    };
    const controller = new VideosController(projectVideoService as never);

    const result = await controller.getVideos('proj-1', 'evt-1');

    expect(projectVideoService.getVideos).toHaveBeenCalledWith(
      'proj-1',
      'evt-1'
    );
    expect(result).toBe('video-stream');
  });

  it('makes the browser revalidate the recording, which each run overwrites', () => {
    const headers: { name: string; value: string }[] = Reflect.getMetadata(
      HEADERS_METADATA,
      VideosController.prototype.getVideos
    );
    expect(headers).toContainEqual({
      name: 'Cache-Control',
      value: 'no-cache'
    });
  });
});
