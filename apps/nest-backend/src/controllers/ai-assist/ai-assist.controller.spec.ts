import { describe, expect, it, vi } from 'vitest';
import type { AiAssistResponse } from '@utils';
import { AiAssistController } from './ai-assist.controller';

describe('AiAssistController', () => {
  const state: AiAssistResponse = {
    settings: {
      enabled: false,
      ollamaUrl: 'http://127.0.0.1:11434',
      model: 'qwen3.5:9b'
    },
    readiness: { kind: 'runtimeUnavailable' }
  };

  it('reads the state', async () => {
    const service = { getState: vi.fn().mockResolvedValue(state) };
    const controller = new AiAssistController(service as never, {} as never);

    await expect(controller.get()).resolves.toBe(state);
  });

  it('passes the body to the update', async () => {
    const service = { updateSettings: vi.fn().mockResolvedValue(state) };
    const controller = new AiAssistController(service as never, {} as never);

    await expect(controller.update({ enabled: true })).resolves.toBe(state);
    expect(service.updateSettings).toHaveBeenCalledWith({ enabled: true });
  });

  it('reads what a run saw when a step failed', async () => {
    const context = { stepIndex: 3 };
    const stepFailures = { get: vi.fn().mockResolvedValue(context) };
    const controller = new AiAssistController(
      {} as never,
      stepFailures as never
    );

    await expect(controller.getStepFailure('demo', 'e1', 5)).resolves.toBe(
      context
    );
    expect(stepFailures.get).toHaveBeenCalledWith('demo', 'e1', 5);
  });
});
