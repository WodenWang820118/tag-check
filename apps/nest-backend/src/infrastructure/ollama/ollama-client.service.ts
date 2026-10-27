import { Injectable, Logger } from '@nestjs/common';
import { normalizeOllamaUrl } from '@utils';

/**
 * How long a status request waits. Ollama on this computer answers at once;
 * no answer by then means it is not running.
 */
export const OLLAMA_PROBE_TIMEOUT_MS = 3_000;

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

  private async getJson(baseUrl: string, path: string): Promise<unknown> {
    const origin = normalizeOllamaUrl(baseUrl);
    if (origin === null) {
      throw new Error(`Not an Ollama address on this computer: ${baseUrl}`);
    }
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
