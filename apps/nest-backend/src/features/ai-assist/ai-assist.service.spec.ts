import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_AI_ASSIST_SETTINGS } from '@utils';
import { AI_ASSIST_SETTING_NAMES, AiAssistService } from './ai-assist.service';

function build(stored: Record<string, string> = {}) {
  const values = new Map(Object.entries(stored));
  const configurations = {
    getValue: vi.fn(async (name: string) => values.get(name) ?? null),
    setValue: vi.fn(async (name: string, value: string) => {
      values.set(name, value);
    })
  };
  const ollama = {
    version: vi.fn<(baseUrl: string) => Promise<string | null>>(),
    models: vi.fn<(baseUrl: string) => Promise<string[] | null>>()
  };
  const service = new AiAssistService(configurations as never, ollama as never);
  return { service, configurations, ollama };
}

describe('AiAssistService', () => {
  describe('getSettings()', () => {
    it('starts with the defaults', async () => {
      const { service } = build();

      await expect(service.getSettings()).resolves.toEqual(
        DEFAULT_AI_ASSIST_SETTINGS
      );
    });

    it('reads the stored entries', async () => {
      const { service } = build({
        [AI_ASSIST_SETTING_NAMES.enabled]: 'true',
        [AI_ASSIST_SETTING_NAMES.ollamaUrl]: 'http://localhost:8080',
        [AI_ASSIST_SETTING_NAMES.model]: 'qwen3.5:4b'
      });

      await expect(service.getSettings()).resolves.toEqual({
        enabled: true,
        ollamaUrl: 'http://localhost:8080',
        model: 'qwen3.5:4b'
      });
    });

    it('falls back to the defaults for unreadable entries', async () => {
      const { service } = build({
        [AI_ASSIST_SETTING_NAMES.enabled]: 'yes',
        [AI_ASSIST_SETTING_NAMES.ollamaUrl]: 'http://example.com',
        [AI_ASSIST_SETTING_NAMES.model]: 'bad model'
      });

      await expect(service.getSettings()).resolves.toEqual(
        DEFAULT_AI_ASSIST_SETTINGS
      );
    });
  });

  describe('getState()', () => {
    it('is ready when Ollama has the model', async () => {
      const { service, ollama } = build();
      ollama.version.mockResolvedValue('0.40.8');
      ollama.models.mockResolvedValue(['qwen3.5:9b', 'qwen3.5:4b']);

      await expect(service.getState()).resolves.toEqual({
        settings: DEFAULT_AI_ASSIST_SETTINGS,
        readiness: {
          kind: 'ready',
          version: '0.40.8',
          models: ['qwen3.5:9b', 'qwen3.5:4b']
        }
      });
      expect(ollama.version).toHaveBeenCalledWith('http://127.0.0.1:11434');
    });

    it('gives the command to download a missing model', async () => {
      const { service, ollama } = build();
      ollama.version.mockResolvedValue('0.40.8');
      ollama.models.mockResolvedValue(['qwen3.5:4b']);

      const { readiness } = await service.getState();

      expect(readiness).toEqual({
        kind: 'modelMissing',
        version: '0.40.8',
        models: ['qwen3.5:4b'],
        command: 'ollama pull qwen3.5:9b'
      });
    });

    it('says when Ollama does not answer', async () => {
      const { service, ollama } = build();
      ollama.version.mockResolvedValue(null);

      const { readiness } = await service.getState();

      expect(readiness).toEqual({ kind: 'runtimeUnavailable' });
      expect(ollama.models).not.toHaveBeenCalled();
    });

    it('says when Ollama answers without a model list', async () => {
      const { service, ollama } = build();
      ollama.version.mockResolvedValue('0.40.8');
      ollama.models.mockResolvedValue(null);

      await expect(service.getState()).resolves.toMatchObject({
        readiness: { kind: 'runtimeUnavailable' }
      });
    });
  });

  describe('updateSettings()', () => {
    it('saves only the given fields and returns the new state', async () => {
      const { service, configurations, ollama } = build();
      ollama.version.mockResolvedValue(null);

      const state = await service.updateSettings({
        enabled: true,
        model: 'qwen3.5:4b'
      });

      expect(configurations.setValue).toHaveBeenCalledTimes(2);
      expect(configurations.setValue).toHaveBeenCalledWith(
        AI_ASSIST_SETTING_NAMES.enabled,
        'true',
        expect.any(String)
      );
      expect(state.settings).toEqual({
        ...DEFAULT_AI_ASSIST_SETTINGS,
        enabled: true,
        model: 'qwen3.5:4b'
      });
    });

    it('rejects an invalid body with the reason', async () => {
      const { service, configurations } = build();

      await expect(
        service.updateSettings({ ollamaUrl: 'http://10.0.0.2:11434' })
      ).rejects.toThrow(BadRequestException);
      expect(configurations.setValue).not.toHaveBeenCalled();
    });
  });
});
