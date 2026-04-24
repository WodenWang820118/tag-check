import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InspectorGroupEventsService } from './inspector-group-events.service';

describe('InspectorGroupEventsService browser lifecycle', () => {
  let fileService: {
    getOperationJsonByProject: ReturnType<typeof vi.fn>;
    writeCacheFile: ReturnType<typeof vi.fn>;
  };
  let filePathService: { getImageFilePath: ReturnType<typeof vi.fn> };
  let inspectorSingleEventService: {
    inspectDataLayer: ReturnType<typeof vi.fn>;
  };
  let service: InspectorGroupEventsService;

  beforeEach(() => {
    fileService = {
      getOperationJsonByProject: vi.fn().mockResolvedValue(['event-a.json']),
      writeCacheFile: vi.fn().mockResolvedValue(undefined)
    };
    filePathService = {
      getImageFilePath: vi.fn().mockResolvedValue('image-path')
    };
    inspectorSingleEventService = {
      inspectDataLayer: vi.fn().mockResolvedValue({ passed: true })
    };
    service = new InspectorGroupEventsService(
      fileService as any,
      filePathService as any,
      inspectorSingleEventService as any,
      { determineStrategy: vi.fn() } as any,
      {}
    );
  });

  it('does not close the shared browser from inside a batch operation', async () => {
    const page = createMockPage();
    const context = createMockContext(page);
    const browser = createMockBrowser(context);

    await service.inspectProjectDataLayer(
      browser as any,
      'project',
      'G-TEST',
      { username: '', password: '' },
      'false',
      1
    );

    expect(browser.close).not.toHaveBeenCalled();
    expect(context.close).toHaveBeenCalledTimes(1);
    expect(page.close).toHaveBeenCalledTimes(1);
  });

  it('closes only the operation page and closes context once when inspection fails', async () => {
    inspectorSingleEventService.inspectDataLayer.mockRejectedValue(
      new Error('inspection failed')
    );
    const page = createMockPage();
    const context = createMockContext(page);
    const browser = createMockBrowser(context);

    const result = await service.inspectProjectDataLayer(
      browser as any,
      'project',
      'G-TEST',
      { username: '', password: '' },
      'false',
      1
    );

    expect(result[0]).toEqual({ error: expect.any(Error) });
    expect(fileService.writeCacheFile).toHaveBeenCalledWith(
      'project',
      'event-a.json',
      expect.any(Error)
    );
    expect(browser.close).not.toHaveBeenCalled();
    expect(context.close).toHaveBeenCalledTimes(1);
    expect(page.close).toHaveBeenCalledTimes(1);
  });
});

function createMockPage() {
  return {
    screenshot: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined)
  };
}

function createMockContext(page: ReturnType<typeof createMockPage>) {
  return {
    newPage: vi.fn().mockResolvedValue(page),
    close: vi.fn().mockResolvedValue(undefined)
  };
}

function createMockBrowser(context: ReturnType<typeof createMockContext>) {
  return {
    createBrowserContext: vi.fn().mockResolvedValue(context),
    pages: vi.fn().mockResolvedValue([]),
    close: vi.fn().mockResolvedValue(undefined)
  };
}
