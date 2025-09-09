import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ExampleProjectRepositoryService } from './example-project-repository.service';

// Minimal mocks for the dependencies used by the service
const mockProjectRepositoryService = {
  list: vi.fn().mockResolvedValue([]),
  getEntityBySlug: vi.fn().mockResolvedValue({ id: 'proj-1' })
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
});
