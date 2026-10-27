import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  OLLAMA_PROBE_TIMEOUT_MS,
  OllamaChatError,
  OllamaClientService
} from './ollama-client.service';

function answer(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

describe('OllamaClientService', () => {
  const client = new OllamaClientService();

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the version from /api/version, with a timeout', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(answer(200, { version: '0.40.8' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(client.version('http://127.0.0.1:11434/')).resolves.toBe(
      '0.40.8'
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:11434/api/version',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(OLLAMA_PROBE_TIMEOUT_MS).toBeGreaterThan(0);
  });

  it('lists the model names from /api/tags', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        answer(200, {
          models: [
            { name: 'qwen3.5:9b', size: 1 },
            { name: 'llama3:latest' },
            {}
          ]
        })
      )
    );

    await expect(client.models('http://localhost:11434')).resolves.toEqual([
      'qwen3.5:9b',
      'llama3:latest'
    ]);
  });

  it('gives null when Ollama does not answer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('fetch failed'))
    );

    await expect(client.version('http://127.0.0.1:11434')).resolves.toBeNull();
    await expect(client.models('http://127.0.0.1:11434')).resolves.toBeNull();
  });

  it('gives null for an error status or an unexpected body', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(answer(500, { error: 'boom' }))
        .mockResolvedValueOnce(answer(200, { models: 'none' }))
        .mockResolvedValueOnce(answer(200, ['0.1']))
    );

    await expect(client.version('http://127.0.0.1:11434')).resolves.toBeNull();
    await expect(client.models('http://127.0.0.1:11434')).resolves.toBeNull();
    await expect(client.version('http://127.0.0.1:11434')).resolves.toBeNull();
  });

  it('never calls an address off this computer', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(client.version('http://10.0.0.2:11434')).rejects.toThrow(
      'Not an Ollama address on this computer'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe('chat()', () => {
    const request = {
      model: 'qwen3.5:9b',
      messages: [{ role: 'user' as const, content: 'Which one?' }],
      format: { type: 'object' }
    };

    it('posts the chat, not streamed, deterministic and without thinking', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        answer(200, {
          message: { role: 'assistant', content: '{"matches":[]}' }
        })
      );
      vi.stubGlobal('fetch', fetchMock);

      await expect(
        client.chat('http://127.0.0.1:11434', request)
      ).resolves.toBe('{"matches":[]}');
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('http://127.0.0.1:11434/api/chat');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({
        ...request,
        stream: false,
        think: false,
        options: { temperature: 0 }
      });
    });

    it("reports Ollama's error", async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(answer(404, { error: 'model "x" not found' }))
      );

      await expect(
        client.chat('http://127.0.0.1:11434', request)
      ).rejects.toThrow(
        new OllamaChatError('Ollama answered 404: model "x" not found')
      );
    });

    it('reports an answer without a message, or no answer', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValueOnce(answer(200, { done: true }))
          .mockRejectedValueOnce(new DOMException('timed out', 'TimeoutError'))
      );

      await expect(
        client.chat('http://127.0.0.1:11434', request)
      ).rejects.toThrow('Ollama answered without a message');
      await expect(
        client.chat('http://127.0.0.1:11434', request)
      ).rejects.toThrow(OllamaChatError);
    });

    it('never posts to an address off this computer', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      await expect(
        client.chat('http://10.0.0.2:11434', request)
      ).rejects.toThrow('Not an Ollama address on this computer');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
