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
});
