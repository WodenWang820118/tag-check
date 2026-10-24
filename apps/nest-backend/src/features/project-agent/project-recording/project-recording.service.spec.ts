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
  const service = new ProjectRecordingService(
    fileService as never,
    filePathService as never
  );
  return { service, fileService, filePathService };
}

describe('ProjectRecordingService', () => {
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
