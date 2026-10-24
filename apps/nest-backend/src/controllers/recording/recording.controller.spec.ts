import { describe, expect, it, vi } from 'vitest';
import { RecordingController } from './recording.controller';

describe('RecordingController', () => {
  function build() {
    const projectRecordingService = {
      updateRecording: vi.fn().mockResolvedValue(undefined)
    };
    const recordingRepositoryService = {
      listByProject: vi.fn().mockResolvedValue([{ id: 'r-1' }]),
      getRecordingDetails: vi.fn().mockResolvedValue({ id: 'r-1' }),
      update: vi.fn().mockResolvedValue('updated')
    };
    const controller = new RecordingController(
      projectRecordingService as never,
      recordingRepositoryService as never
    );
    return { controller, recordingRepositoryService, projectRecordingService };
  }

  it('getRecordings delegates to RecordingRepositoryService.listByProject', async () => {
    const { controller, recordingRepositoryService } = build();
    const result = await controller.getRecordings('proj-1');
    expect(recordingRepositoryService.listByProject).toHaveBeenCalledWith(
      'proj-1'
    );
    expect(result).toEqual([{ id: 'r-1' }]);
  });

  it('getRecordingDetails delegates to RecordingRepositoryService.getRecordingDetails', async () => {
    const { controller, recordingRepositoryService } = build();
    const result = await controller.getRecordingDetails('proj-1', 'evt-1');
    expect(recordingRepositoryService.getRecordingDetails).toHaveBeenCalledWith(
      'proj-1',
      'evt-1'
    );
    expect(result).toEqual({ id: 'r-1' });
  });

  it('updateRecording forwards only title and steps to the repository', async () => {
    const { controller, recordingRepositoryService } = build();
    const recording = {
      title: 'My Recording',
      steps: [{ type: 'click' }],
      ignored: 'should not be passed'
    } as never;
    await controller.updateRecording('proj-1', 'evt-1', recording);
    expect(recordingRepositoryService.update).toHaveBeenCalledWith(
      'proj-1',
      'evt-1',
      { title: 'My Recording', steps: [{ type: 'click' }] }
    );
  });

  it('updateRecording also rewrites the recording file a run reads', async () => {
    const { controller, projectRecordingService } = build();
    const steps = [{ type: 'navigate', url: 'https://new.example' }];
    await controller.updateRecording('proj-1', 'evt-1', {
      title: 'checkout',
      steps
    } as never);
    expect(projectRecordingService.updateRecording).toHaveBeenCalledWith(
      'proj-1',
      'evt-1',
      { title: 'checkout', steps }
    );
  });
});
