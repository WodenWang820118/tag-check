import Module from 'module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GroupEventsInspectionService } from './group-events-inspection.service';

describe('GroupEventsInspectionService browser ownership', () => {
  const originalRequire = Module.prototype.require;
  let browser: ReturnType<typeof createMockBrowser>;
  let service: GroupEventsInspectionService;
  let inspectorGroupEventsService: {
    inspectProjectDataLayer: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    browser = createMockBrowser();
    vi.spyOn(Module.prototype, 'require').mockImplementation(function (
      this: unknown,
      id: string
    ) {
      if (id === 'puppeteer-chromium-resolver') {
        return vi.fn().mockResolvedValue({
          puppeteer: {
            launch: vi.fn().mockResolvedValue(browser)
          },
          executablePath: 'chromium'
        });
      }
      return originalRequire.apply(this, [id]);
    });

    inspectorGroupEventsService = {
      inspectProjectDataLayer: vi.fn().mockResolvedValue([
        {
          dataLayerCheckResult: { passed: true },
          requestCheckResult: { passed: true },
          rawRequest: '',
          destinationUrl: 'https://example.test'
        }
      ])
    };
    service = new GroupEventsInspectionService(
      {} as any,
      inspectorGroupEventsService as any,
      {
        writeProjectAbstractTestResultJson: vi.fn().mockResolvedValue(undefined)
      } as any,
      { getBROWSER_ARGS: vi.fn(() => []) } as any
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('closes the browser it launches after a successful project inspection', async () => {
    await service.inspectProject(
      'project',
      'true',
      'G-TEST',
      { username: '', password: '' },
      'false',
      1
    );

    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it('closes the browser it launches when project inspection fails', async () => {
    inspectorGroupEventsService.inspectProjectDataLayer.mockRejectedValue(
      new Error('project inspection failed')
    );

    await expect(
      service.inspectProject(
        'project',
        'true',
        'G-TEST',
        { username: '', password: '' },
        'false',
        1
      )
    ).rejects.toThrow('project inspection failed');

    expect(browser.close).toHaveBeenCalledTimes(1);
  });
});

function createMockBrowser() {
  return {
    pages: vi.fn().mockResolvedValue([]),
    close: vi.fn().mockResolvedValue(undefined)
  };
}
