import { describe, expect, it, vi } from 'vitest';
import { ProjectRecordingService } from './project-recording.service';

function build() {
  const fileService = {
    readJsonFile: vi.fn(),
    writeJsonFile: vi.fn()
  };
  const filePathService = {
    getRecordingFilePath: vi.fn(
      async (slug: string, name: string) => `/rec/${slug}/${name}`
    )
  };
  const folderService = { getJsonFilesFromDir: vi.fn() };
  const folderPathService = {
    getRecordingFolderPath: vi.fn().mockResolvedValue('/rec/demo')
  };
  const service = new ProjectRecordingService(
    fileService as never,
    filePathService as never,
    folderService as never,
    folderPathService as never
  );
  return { service, fileService, filePathService, folderService };
}

describe('ProjectRecordingService', () => {
  it('getProjectRecordings() loads each json file and returns a flattened map keyed by file basename', async () => {
    const ctx = build();
    ctx.folderService.getJsonFilesFromDir.mockReturnValue(['a.json', 'b.json']);
    ctx.fileService.readJsonFile
      .mockReturnValueOnce({ title: 'A', steps: [] })
      .mockReturnValueOnce({ title: 'B', steps: [] });
    const result = await ctx.service.getProjectRecordings('demo');
    expect(result.projectSlug).toBe('demo');
    expect(Object.keys(result.recordings).sort()).toEqual(['a', 'b']);
  });

  it('getProjectRecordingNames() strips the .json suffix from filenames', async () => {
    const ctx = build();
    ctx.folderService.getJsonFilesFromDir.mockReturnValue(['a.json', 'b.json']);
    expect(await ctx.service.getProjectRecordingNames('demo')).toEqual([
      'a',
      'b'
    ]);
  });

  it('getRecordingDetails() reads the per-event recording file', async () => {
    const ctx = build();
    ctx.fileService.readJsonFile.mockReturnValue({ title: 'X' });
    const result = await ctx.service.getRecordingDetails('demo', 'evt');
    expect(ctx.filePathService.getRecordingFilePath).toHaveBeenCalledWith(
      'demo',
      'evt.json'
    );
    expect(result).toEqual({ title: 'X' });
  });

  it('addRecording() writes the recording json to the resolved path', async () => {
    const ctx = build();
    await ctx.service.addRecording('demo', 'evt', {
      title: 't',
      steps: []
    } as never);
    expect(ctx.fileService.writeJsonFile).toHaveBeenCalledWith(
      '/rec/demo/evt.json',
      {
        title: 't',
        steps: []
      }
    );
  });

  it('updateRecording() also writes through saveRecording', async () => {
    const ctx = build();
    await ctx.service.updateRecording('demo', 'evt', {
      title: 't',
      steps: []
    } as never);
    expect(ctx.fileService.writeJsonFile).toHaveBeenCalledTimes(1);
  });
});
