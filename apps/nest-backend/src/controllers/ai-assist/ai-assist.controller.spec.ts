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
    const controller = new AiAssistController(
      service as never,
      {} as never,
      {} as never,
      {} as never
    );

    await expect(controller.get()).resolves.toBe(state);
  });

  it('passes the body to the update', async () => {
    const service = { updateSettings: vi.fn().mockResolvedValue(state) };
    const controller = new AiAssistController(
      service as never,
      {} as never,
      {} as never,
      {} as never
    );

    await expect(controller.update({ enabled: true })).resolves.toBe(state);
    expect(service.updateSettings).toHaveBeenCalledWith({ enabled: true });
  });

  it('reads what a run saw when a step failed', async () => {
    const context = { stepIndex: 3 };
    const stepFailures = { get: vi.fn().mockResolvedValue(context) };
    const controller = new AiAssistController(
      {} as never,
      stepFailures as never,
      {} as never,
      {} as never
    );

    await expect(controller.getStepFailure('demo', 'e1', 5)).resolves.toBe(
      context
    );
    expect(stepFailures.get).toHaveBeenCalledWith('demo', 'e1', 5);
  });

  it('asks for suggestions and runs trials', async () => {
    const suggestions = {
      suggest: vi.fn().mockResolvedValue({ suggestions: [] })
    };
    const trials = { run: vi.fn().mockResolvedValue({ runId: 9 }) };
    const controller = new AiAssistController(
      {} as never,
      {} as never,
      suggestions as never,
      trials as never
    );
    const body = { stepIndex: 4, selectors: ['#new'] };

    await expect(controller.suggest('demo', 'e1', 5)).resolves.toEqual({
      suggestions: []
    });
    await expect(controller.trial('demo', 'e1', body)).resolves.toEqual({
      runId: 9
    });
    expect(suggestions.suggest).toHaveBeenCalledWith('demo', 'e1', 5);
    expect(trials.run).toHaveBeenCalledWith('demo', 'e1', body);
  });
});
