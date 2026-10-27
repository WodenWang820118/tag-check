import { HttpStatus, StreamableFile } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ProjectDataRetrievalController } from './project-data-retrieval.controller';

describe('ProjectDataRetrievalController', () => {
  function build(overrides: Record<string, unknown> = {}) {
    const testImageRepositoryService = {
      getBySlugAndEventId: vi
        .fn()
        .mockResolvedValue({ imageData: Buffer.from('img') }),
      ...overrides
    };
    const projectRepositoryService = {
      getBySlug: vi.fn().mockResolvedValue({ slug: 'proj-1' }),
      ...overrides
    };
    const projectGtmContainerService = {
      read: vi.fn().mockResolvedValue({ containerVersion: {} }),
      ...overrides
    };
    const testEventDetailRepositoryService = {
      getRunScreenshot: vi
        .fn()
        .mockResolvedValue({ imageData: Buffer.from('run-img') })
    };
    const controller = new ProjectDataRetrievalController(
      testImageRepositoryService as never,
      testEventDetailRepositoryService as never,
      projectRepositoryService as never,
      projectGtmContainerService as never
    );
    return {
      controller,
      testImageRepositoryService,
      testEventDetailRepositoryService,
      projectRepositoryService,
      projectGtmContainerService
    };
  }

  it("readImage serves the run's own screenshot for ?run=", async () => {
    const { controller, testEventDetailRepositoryService } = build();
    const result = await controller.readImage('proj-1', 'evt-1', 7);
    expect(
      testEventDetailRepositoryService.getRunScreenshot
    ).toHaveBeenCalledWith('proj-1', 'evt-1', 7, true);
    expect(result).toBeInstanceOf(StreamableFile);
  });

  it('readImage returns a StreamableFile constructed from the image data', async () => {
    const { controller, testImageRepositoryService } = build();
    const result = await controller.readImage('proj-1', 'evt-1');
    expect(testImageRepositoryService.getBySlugAndEventId).toHaveBeenCalledWith(
      'proj-1',
      'evt-1'
    );
    expect(result).toBeInstanceOf(StreamableFile);
  });

  it('readImage answers with an empty file when the test has not run yet', async () => {
    const { controller } = build({
      getBySlugAndEventId: vi.fn().mockResolvedValue(null)
    });
    const result = await controller.readImage('proj-1', 'evt-1');
    expect(result).toBeInstanceOf(StreamableFile);
    expect(result.getStream().read()).toBeNull();
  });

  it('getProject delegates to ProjectRepositoryService.getBySlug', async () => {
    const { controller, projectRepositoryService } = build();
    const result = await controller.getProject('proj-1');
    expect(projectRepositoryService.getBySlug).toHaveBeenCalledWith('proj-1');
    expect(result).toEqual({ slug: 'proj-1' });
  });

  it("getGtmConfig returns the container saved in the project's config folder", async () => {
    const { controller, projectGtmContainerService } = build();
    const result = await controller.getGtmConfig('proj-1');
    expect(projectGtmContainerService.read).toHaveBeenCalledWith('proj-1');
    expect(result).toEqual({ containerVersion: {} });
  });

  it('getGtmConfig throws 404 when the project has no readable container', async () => {
    const { controller } = build({
      read: vi.fn().mockResolvedValue(null)
    });
    await expect(controller.getGtmConfig('proj-1')).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND
    });
  });

  it('getGtmConfig does not cache: a newly imported container is served', async () => {
    const read = vi
      .fn()
      .mockResolvedValueOnce({ containerVersion: { tag: ['old'] } })
      .mockResolvedValueOnce({ containerVersion: { tag: ['new'] } });
    const { controller } = build({ read });
    await controller.getGtmConfig('proj-1');
    expect(await controller.getGtmConfig('proj-1')).toEqual({
      containerVersion: { tag: ['new'] }
    });
    expect(
      Reflect.getMetadataKeys(
        ProjectDataRetrievalController.prototype.getGtmConfig
      )
    ).not.toContain('__interceptors__');
  });
});
