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
  const recordingRepositoryService = {
    getRecordingDetails: vi.fn().mockResolvedValue({
      title: 'previous',
      steps: [{ type: 'navigate', url: 'https://old.example' }]
    }),
    update: vi.fn().mockResolvedValue('updated')
  };
  const service = new ProjectRecordingService(
    fileService as never,
    filePathService as never,
    recordingRepositoryService as never
  );
  return { service, fileService, filePathService, recordingRepositoryService };
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

  it('restores the database row when the recording file update throws', async () => {
    const ctx = build();
    const previousSteps = [{ type: 'navigate', url: 'https://old.example' }];
    const nextSteps = [{ type: 'navigate', url: 'https://new.example' }];
    const failure = new Error('disk full');
    ctx.recordingRepositoryService.getRecordingDetails.mockResolvedValue({
      title: 'Checkout',
      steps: previousSteps
    });
    ctx.fileService.writeJsonFile.mockImplementation(() => {
      throw failure;
    });

    await expect(
      ctx.service.updateRecordingAndFile('demo', 'evt', {
        title: 'Checkout revised',
        steps: nextSteps
      })
    ).rejects.toBe(failure);

    expect(ctx.recordingRepositoryService.update).toHaveBeenNthCalledWith(
      1,
      'demo',
      'evt',
      { title: 'Checkout revised', steps: nextSteps }
    );
    expect(ctx.recordingRepositoryService.update).toHaveBeenNthCalledWith(
      2,
      'demo',
      'evt',
      { title: 'Checkout', steps: previousSteps }
    );
    expect(ctx.fileService.writeJsonFile).toHaveBeenCalledTimes(1);
  });
});
