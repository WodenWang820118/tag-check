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
      getGtmConfigBySlug: vi.fn().mockResolvedValue('/config'),
      ...overrides
    };
    const fileService = {
      readJsonFile: vi.fn().mockResolvedValue({ container: 'x' }),
      ...overrides
    };
    const controller = new ProjectDataRetrievalController(
      testImageRepositoryService as never,
      projectRepositoryService as never,
      fileService as never
    );
    return {
      controller,
      testImageRepositoryService,
      projectRepositoryService,
      fileService
    };
  }

  it('readImage returns a StreamableFile constructed from the image data', async () => {
    const { controller, testImageRepositoryService } = build();
    const result = await controller.readImage('proj-1', 'evt-1');
    expect(testImageRepositoryService.getBySlugAndEventId).toHaveBeenCalledWith(
      'proj-1',
      'evt-1'
    );
    expect(result).toBeInstanceOf(StreamableFile);
  });

  it('getProject delegates to ProjectRepositoryService.getBySlug', async () => {
    const { controller, projectRepositoryService } = build();
    const result = await controller.getProject('proj-1');
    expect(projectRepositoryService.getBySlug).toHaveBeenCalledWith('proj-1');
    expect(result).toEqual({ slug: 'proj-1' });
  });

  it('getGtmConfig reads the gtm-container.json file from the resolved config path', async () => {
    const { controller, fileService, projectRepositoryService } = build();
    const result = await controller.getGtmConfig('proj-1');
    expect(projectRepositoryService.getGtmConfigBySlug).toHaveBeenCalledWith(
      'proj-1'
    );
    expect(fileService.readJsonFile).toHaveBeenCalledOnce();
    const callArg = fileService.readJsonFile.mock.calls[0][0] as string;
    expect(callArg.replace(/\\/g, '/')).toMatch(/\/gtm-container\.json$/);
    expect(result).toEqual({ container: 'x' });
  });

  it('getGtmConfig throws 404 HttpException when no config path exists', async () => {
    const { controller } = build({
      getGtmConfigBySlug: vi.fn().mockResolvedValue(null)
    });
    await expect(controller.getGtmConfig('proj-1')).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND
    });
  });

  it('getGtmConfig propagates file read errors thrown by FileService', async () => {
    // The controller currently does not await fileService.readJsonFile inside
    // its try/catch, so async rejections are surfaced to the caller as-is
    // rather than being wrapped in a 500 HttpException.
    const { controller } = build({
      readJsonFile: vi.fn().mockRejectedValue(new Error('disk fail'))
    });
    await expect(controller.getGtmConfig('proj-1')).rejects.toThrow(
      'disk fail'
    );
  });
});
