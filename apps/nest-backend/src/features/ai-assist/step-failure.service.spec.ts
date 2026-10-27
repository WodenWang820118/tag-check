import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { StepFailureService } from './step-failure.service';

const KEY_7 = '00000000-0000-4000-8000-000000000007';
const KEY_5 = '00000000-0000-4000-8000-000000000005';
const context = { stepIndex: 3 } as never;

function build(readStepFailure = vi.fn().mockResolvedValue(context)) {
  const testEventDetails = {
    listRunHistory: vi.fn().mockResolvedValue([
      { runId: 7, recordingKey: KEY_7 },
      { runId: 6, recordingKey: null },
      { runId: 5, recordingKey: KEY_5 }
    ])
  };
  const runRecordings = { readStepFailure };
  return {
    service: new StepFailureService(
      testEventDetails as never,
      runRecordings as never
    ),
    readStepFailure
  };
}

describe('StepFailureService', () => {
  it("reads the latest run's by default", async () => {
    const { service, readStepFailure } = build();

    await expect(service.get('demo', 'e1')).resolves.toBe(context);
    expect(readStepFailure).toHaveBeenCalledWith('demo', 'e1', KEY_7);
  });

  it("reads the given run's", async () => {
    const { service, readStepFailure } = build();

    await service.get('demo', 'e1', 5);

    expect(readStepFailure).toHaveBeenCalledWith('demo', 'e1', KEY_5);
  });

  it('is not found for a run without recordings, an unknown run or none kept', async () => {
    const { service, readStepFailure } = build(vi.fn().mockResolvedValue(null));

    await expect(service.get('demo', 'e1', 6)).rejects.toThrow(
      NotFoundException
    );
    await expect(service.get('demo', 'e1', 99)).rejects.toThrow(
      NotFoundException
    );
    await expect(service.get('demo', 'e1')).rejects.toThrow(NotFoundException);
    expect(readStepFailure).toHaveBeenCalledTimes(1);
  });
});
