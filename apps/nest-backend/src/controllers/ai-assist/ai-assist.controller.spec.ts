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
    const controller = new AiAssistController(service as never);

    await expect(controller.get()).resolves.toBe(state);
  });

  it('passes the body to the update', async () => {
    const service = { updateSettings: vi.fn().mockResolvedValue(state) };
    const controller = new AiAssistController(service as never);

    await expect(controller.update({ enabled: true })).resolves.toBe(state);
    expect(service.updateSettings).toHaveBeenCalledWith({ enabled: true });
  });
});
