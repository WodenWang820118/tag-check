import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ExampleProjectRepositoryService } from './example-project-repository.service';

// Minimal mocks for the dependencies used by the service
const visibleProject = {
  id: 'proj-1',
  projectSlug: 'example-project-slug'
};
const mockProjectRepositoryService = {
  list: vi.fn().mockResolvedValue([visibleProject]),
  getEntityBySlug: vi.fn().mockResolvedValue(visibleProject)
};
const mockProjectInitializationService = {
  initProjectFileSystem: vi.fn().mockResolvedValue(undefined)
};
const mockExampleEventsBuilderService = {
  buildEvents: vi.fn().mockResolvedValue(undefined)
};
const mockApplicationSettingRepositoryService = {
  update: vi.fn().mockResolvedValue(undefined)
};
const mockFileService = {
  writeJsonFile: vi.fn()
};
const mockFolderPathService = {
  getProjectConfigFolderPath: vi.fn().mockResolvedValue('/tmp/example')
};

let service: ExampleProjectRepositoryService;

beforeEach(() => {
  vi.clearAllMocks();
  mockProjectRepositoryService.list.mockResolvedValue([visibleProject]);
  mockProjectRepositoryService.getEntityBySlug.mockResolvedValue(
    visibleProject
  );
  service = new ExampleProjectRepositoryService(
    // @ts-expect-error - satisfy constructor for test
    mockProjectRepositoryService,
    mockProjectInitializationService,
    mockExampleEventsBuilderService,
    mockApplicationSettingRepositoryService,
    mockFileService,
    mockFolderPathService
  );
});

describe('ExampleProjectRepositoryService', () => {
  it('provides the expected default local storage settings', () => {
    const localStorage = (
      service as unknown as {
        DEFAULT_LOCAL_STORAGE: { data: Array<{ key: string; value: string }> };
      }
    ).DEFAULT_LOCAL_STORAGE;

    expect(localStorage).toBeDefined();
    expect(Array.isArray(localStorage.data)).toBe(true);
    const keys = localStorage.data.map((d) => d.key);
    expect(new Set(keys)).toEqual(new Set(['consent', 'consentPreferences']));
  });

  it('calls applicationSettingRepositoryService.update with localStorage during buildExampleProject', async () => {
    mockProjectRepositoryService.list
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([visibleProject]);

    await service.buildExampleProject();

    expect(mockApplicationSettingRepositoryService.update).toHaveBeenCalled();
    const [[, updatePayload]] =
      mockApplicationSettingRepositoryService.update.mock.calls;
    expect(updatePayload).toBeDefined();
    expect(updatePayload.localStorage).toEqual(
      (service as unknown as { DEFAULT_LOCAL_STORAGE: unknown })
        .DEFAULT_LOCAL_STORAGE
    );
  });

  it('reports startup seed as not ready before module init completes', () => {
    expect(service.getStartupSeedReadiness()).toEqual({
      ready: false,
      projectCount: 0
    });
  });

  it('marks startup seed ready after recreating the example project for an empty project list', async () => {
    mockProjectRepositoryService.list
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([visibleProject]);

    await service.onModuleInit();

    expect(
      mockProjectInitializationService.initProjectFileSystem
    ).toHaveBeenCalledWith(
      'example-project-slug',
      expect.objectContaining({ projectSlug: 'example-project-slug' })
    );
    expect(service.getStartupSeedReadiness()).toEqual({
      ready: true,
      projectCount: 1
    });
  });

  it('does not mark startup seed ready when the recreated project is still not visible', async () => {
    mockProjectRepositoryService.list.mockResolvedValue([]);

    await expect(service.onModuleInit()).rejects.toThrow(
      'Example project startup seed completed but no projects are visible'
    );

    expect(service.getStartupSeedReadiness()).toEqual({
      ready: false,
      projectCount: 0
    });
  });
});
