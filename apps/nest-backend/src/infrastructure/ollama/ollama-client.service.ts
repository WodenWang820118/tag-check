import { Injectable, Logger } from '@nestjs/common';
import { normalizeOllamaUrl } from '@utils';

/**
 * How long a status request waits. Ollama on this computer answers at once;
 * no answer by then means it is not running.
 */
export const OLLAMA_PROBE_TIMEOUT_MS = 3_000;

/**
 * How long a chat request waits: the first one also loads the model, which
 * takes a while on a laptop.
 */
export const OLLAMA_CHAT_TIMEOUT_MS = 180_000;

/** One message of a chat with the model. */
export type OllamaChatMessage = {
  role: 'system' | 'user';
  content: string;
};

/** A chat request whose answer must follow `format`, a JSON schema. */
export type OllamaChatRequest = {
  model: string;
  messages: OllamaChatMessage[];
  format: Record<string, unknown>;
};

/** Ollama answered with an error, nothing usable, or not at all. */
export class OllamaChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OllamaChatError';
  }
}

/**
 * Ollama's HTTP API on this computer
 * (https://github.com/ollama/ollama/blob/main/docs/api.md). Only loopback
 * addresses are called: a page's data never leaves the computer.
 */
@Injectable()
export class OllamaClientService {
  private readonly logger = new Logger(OllamaClientService.name);

  /**
   * Ollama's version (`GET /api/version`), or null when nothing answered at
   * `baseUrl` with one.
   */
  async version(baseUrl: string): Promise<string | null> {
    const body = await this.getJson(baseUrl, '/api/version');
    const version = isRecord(body) ? body['version'] : undefined;
    return typeof version === 'string' ? version : null;
  }

  /**
   * The names of the models Ollama has (`GET /api/tags`), or null when
   * nothing answered at `baseUrl` with a list.
   */
  async models(baseUrl: string): Promise<string[] | null> {
    const body = await this.getJson(baseUrl, '/api/tags');
    const models = isRecord(body) ? body['models'] : undefined;
    if (!Array.isArray(models)) {
      return null;
    }
    return models
      .map((model: unknown) => (isRecord(model) ? model['name'] : undefined))
      .filter((name): name is string => typeof name === 'string');
  }

  /**
   * The model's answer (`POST /api/chat`, not streamed), constrained to the
   * request's JSON schema, deterministic (temperature 0) and without its
   * thinking.
   *
   * @throws OllamaChatError when Ollama does not answer within
   *   OLLAMA_CHAT_TIMEOUT_MS, answers with an error, or with no message.
   */
  async chat(baseUrl: string, request: OllamaChatRequest): Promise<string> {
    const origin = this.originOf(baseUrl);
    let response: Response;
    try {
      response = await fetch(`${origin}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          format: request.format,
          stream: false,
          think: false,
          options: { temperature: 0 }
        }),
        signal: AbortSignal.timeout(OLLAMA_CHAT_TIMEOUT_MS)
      });
    } catch (error) {
      throw new OllamaChatError(`Ollama did not answer: ${String(error)}`);
    }
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const reason = isRecord(body) ? body['error'] : undefined;
      throw new OllamaChatError(
        `Ollama answered ${response.status}${typeof reason === 'string' ? `: ${reason}` : ''}`
      );
    }
    const message = isRecord(body) ? body['message'] : undefined;
    const content = isRecord(message) ? message['content'] : undefined;
    if (typeof content !== 'string') {
      throw new OllamaChatError('Ollama answered without a message');
    }
    return content;
  }

  private originOf(baseUrl: string): string {
    const origin = normalizeOllamaUrl(baseUrl);
    if (origin === null) {
      throw new Error(`Not an Ollama address on this computer: ${baseUrl}`);
    }
    return origin;
  }

  private async getJson(baseUrl: string, path: string): Promise<unknown> {
    const origin = this.originOf(baseUrl);
    try {
      const response = await fetch(`${origin}${path}`, {
        signal: AbortSignal.timeout(OLLAMA_PROBE_TIMEOUT_MS)
      });
      if (!response.ok) {
        this.logger.warn(`Ollama ${path} answered ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (error) {
      this.logger.debug(`Ollama ${path} did not answer: ${String(error)}`);
      return null;
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
