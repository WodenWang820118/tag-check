import {
  BadGatewayException,
  ConflictException,
  ServiceUnavailableException
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { AiAssistReadiness, ElementCandidate } from '@utils';
import { OllamaChatError } from '../../infrastructure/ollama/ollama-client.service';
import { SelectorSuggestionService } from './selector-suggestion.service';

function candidate(index: number, name: string, selectors = [`#c${index}`]) {
  return {
    index,
    tag: 'button',
    role: 'button',
    name,
    attributes: {},
    box: { x: 0, y: 0, width: 10, height: 10 },
    selectors
  } satisfies ElementCandidate;
}

const settings = {
  enabled: true,
  ollamaUrl: 'http://127.0.0.1:11434',
  model: 'qwen3.5:9b'
};
const READY: AiAssistReadiness = {
  kind: 'ready',
  version: '0.40.8',
  models: ['qwen3.5:9b']
};

function build(options: {
  enabled?: boolean;
  readiness?: AiAssistReadiness;
  candidates?: ElementCandidate[];
  answer?: string | Error;
}) {
  const aiAssist = {
    getState: vi.fn().mockResolvedValue({
      settings: { ...settings, enabled: options.enabled ?? true },
      readiness: options.readiness ?? READY
    })
  };
  const context = {
    stepIndex: 4,
    stepType: 'click',
    selectors: [{ selector: 'aria/Add to cart', matches: 0 }],
    timeoutMs: 15000,
    offset: null,
    url: 'https://shop.example/',
    title: 'Shop',
    viewport: { width: 1280, height: 800 },
    candidates: options.candidates ?? [
      candidate(0, 'Home'),
      candidate(1, 'Add to bag')
    ],
    candidatesFound: 2,
    capturedAt: '2026-10-27T10:00:00.000Z'
  };
  const stepFailures = { get: vi.fn().mockResolvedValue(context) };
  const answer = options.answer ?? '{"matches":[{"id":1,"reason":"Renamed"}]}';
  const ollama = {
    chat:
      answer instanceof Error
        ? vi.fn().mockRejectedValue(answer)
        : vi.fn().mockResolvedValue(answer)
  };
  return {
    service: new SelectorSuggestionService(
      aiAssist as never,
      stepFailures as never,
      ollama as never
    ),
    stepFailures,
    ollama
  };
}

describe('SelectorSuggestionService', () => {
  it("returns the model's picks with the run's own candidates", async () => {
    const { service, stepFailures, ollama } = build({});

    await expect(service.suggest('demo', 'e1', 5)).resolves.toEqual({
      stepIndex: 4,
      stepType: 'click',
      model: 'qwen3.5:9b',
      considered: 2,
      suggestions: [
        { candidate: candidate(1, 'Add to bag'), reason: 'Renamed' }
      ]
    });
    expect(stepFailures.get).toHaveBeenCalledWith('demo', 'e1', 5);
    expect(ollama.chat).toHaveBeenCalledWith(
      'http://127.0.0.1:11434',
      expect.objectContaining({
        model: 'qwen3.5:9b',
        format: expect.objectContaining({ required: ['matches'] })
      })
    );
    // The likeliest candidate is listed first.
    const [, user] = ollama.chat.mock.calls[0][1].messages;
    expect(user.content.indexOf('Add to bag')).toBeLessThan(
      user.content.indexOf('Home')
    );
  });

  it('refuses while AI assist is off', async () => {
    const { service, ollama } = build({ enabled: false });

    await expect(service.suggest('demo', 'e1')).rejects.toThrow(
      ConflictException
    );
    expect(ollama.chat).not.toHaveBeenCalled();
  });

  it('says what is missing when Ollama or the model is', async () => {
    await expect(
      build({ readiness: { kind: 'runtimeUnavailable' } }).service.suggest(
        'demo',
        'e1'
      )
    ).rejects.toThrow(
      new ServiceUnavailableException('Ollama is not running.')
    );
    await expect(
      build({
        readiness: {
          kind: 'modelMissing',
          version: '0.40.8',
          models: [],
          command: 'ollama pull qwen3.5:9b'
        }
      }).service.suggest('demo', 'e1')
    ).rejects.toThrow('Run: ollama pull qwen3.5:9b');
  });

  it('does not ask the model when no candidate has a selector', async () => {
    const { service, ollama } = build({
      candidates: [candidate(0, 'Home', [])]
    });

    await expect(service.suggest('demo', 'e1')).resolves.toMatchObject({
      considered: 0,
      suggestions: []
    });
    expect(ollama.chat).not.toHaveBeenCalled();
  });

  it('fails with 502 when the model does not answer usably', async () => {
    await expect(
      build({ answer: 'I think the second one' }).service.suggest('demo', 'e1')
    ).rejects.toThrow(BadGatewayException);
    await expect(
      build({
        answer: new OllamaChatError('Ollama answered 500')
      }).service.suggest('demo', 'e1')
    ).rejects.toThrow(new BadGatewayException('Ollama answered 500'));
  });

  it('rethrows any other failure as it is', async () => {
    const error = new TypeError('boom');

    await expect(
      build({ answer: error }).service.suggest('demo', 'e1')
    ).rejects.toBe(error);
  });
});
