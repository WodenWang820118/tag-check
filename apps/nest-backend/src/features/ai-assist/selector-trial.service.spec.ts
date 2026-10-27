import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { SelectorTrialService } from './selector-trial.service';

function build(
  steps: unknown[] | null = [
    { type: 'navigate', url: 'https://shop.example/' },
    { type: 'click', selectors: [['#gone']] }
  ]
) {
  const recordings = {
    getRecordingDetails: vi.fn().mockResolvedValue(steps ? { steps } : null)
  };
  const testEventDetails = {
    listRunHistory: vi
      .fn()
      .mockResolvedValue([
        { runId: 42, passed: true, requestPassed: false, recordingKey: null }
      ])
  };
  const testRun = { run: vi.fn().mockResolvedValue(undefined) };
  return {
    service: new SelectorTrialService(
      recordings as never,
      testEventDetails as never,
      testRun as never
    ),
    testRun
  };
}

describe('SelectorTrialService', () => {
  it('runs the test headless with the step trying the selectors, and returns the run', async () => {
    const { service, testRun } = build();

    await expect(
      service.run('demo', 'e1', { stepIndex: 1, selectors: [' #new '] })
    ).resolves.toEqual({ runId: 42, passed: true, requestPassed: false });
    expect(testRun.run).toHaveBeenCalledWith('demo', 'e1', {
      headless: true,
      stepOverride: { stepIndex: 1, selectors: ['#new'] }
    });
  });

  it('rejects an invalid body', async () => {
    const { service, testRun } = build();

    await expect(
      service.run('demo', 'e1', { stepIndex: 1, selectors: [] })
    ).rejects.toThrow(BadRequestException);
    expect(testRun.run).not.toHaveBeenCalled();
  });

  it('rejects a step the recording lacks, or one without selectors', async () => {
    const { service, testRun } = build();

    await expect(
      service.run('demo', 'e1', { stepIndex: 0, selectors: ['#new'] })
    ).rejects.toThrow('Step 1 of the recording has no selectors to replace');
    await expect(
      service.run('demo', 'e1', { stepIndex: 9, selectors: ['#new'] })
    ).rejects.toThrow(BadRequestException);
    await expect(
      build(null).service.run('demo', 'e1', { stepIndex: 1, selectors: ['#a'] })
    ).rejects.toThrow(BadRequestException);
    expect(testRun.run).not.toHaveBeenCalled();
  });
});
