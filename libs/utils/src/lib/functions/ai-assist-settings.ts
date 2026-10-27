import type {
  AiAssistSettings,
  AiAssistSettingsRequest
} from '../types/tag-check/ai-assist.type';

/**
 * AI assist starts off, pointed at Ollama's default address. The default
 * model is about 6.6 GB to download.
 */
export const DEFAULT_AI_ASSIST_SETTINGS: AiAssistSettings = {
  enabled: false,
  ollamaUrl: 'http://127.0.0.1:11434',
  model: 'qwen3.5:9b'
};

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * An Ollama model name: `[namespace/]name[:tag]`. Only these characters,
 * because the name is also shown in a terminal command to copy.
 */
const MODEL_NAME_PATTERN =
  /^[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)?(:[a-z0-9][a-z0-9._-]*)?$/i;

/** The longest model name the API accepts. */
export const OLLAMA_MODEL_NAME_MAX_LENGTH = 200;

/**
 * Ollama's address as the backend calls it (`http://127.0.0.1:11434`), or
 * null unless it is http(s) on this computer, with no path, credentials,
 * query or fragment. The page data the model reads never leaves the
 * computer.
 */
export function normalizeOllamaUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    !LOOPBACK_HOSTS.has(url.hostname) ||
    url.username !== '' ||
    url.password !== '' ||
    url.pathname !== '/' ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    return null;
  }
  return url.origin;
}

/** Whether `value` is a model name Ollama accepts. */
export function isOllamaModelName(value: string): boolean {
  return (
    value.length <= OLLAMA_MODEL_NAME_MAX_LENGTH &&
    MODEL_NAME_PATTERN.test(value)
  );
}

/** Settings that passed validation, or the reason they did not. */
export type AiAssistSettingsValidation =
  | { ok: true; settings: AiAssistSettingsRequest }
  | { ok: false; error: string };

/**
 * Checks the body of PUT /ai-assist. Every field is optional; the ones
 * given come back normalized, and unknown fields are dropped.
 */
export function validateAiAssistSettings(
  input: unknown
): AiAssistSettingsValidation {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, error: 'The body must be an object' };
  }
  const body = input as Record<string, unknown>;
  const settings: AiAssistSettingsRequest = {};

  if (body['enabled'] !== undefined) {
    if (typeof body['enabled'] !== 'boolean') {
      return { ok: false, error: 'enabled must be true or false' };
    }
    settings.enabled = body['enabled'];
  }
  if (body['ollamaUrl'] !== undefined) {
    const url =
      typeof body['ollamaUrl'] === 'string'
        ? normalizeOllamaUrl(body['ollamaUrl'])
        : null;
    if (url === null) {
      return {
        ok: false,
        error:
          'ollamaUrl must be an http(s) address on this computer (localhost, 127.0.0.1 or [::1]), such as http://127.0.0.1:11434'
      };
    }
    settings.ollamaUrl = url;
  }
  if (body['model'] !== undefined) {
    const model = typeof body['model'] === 'string' ? body['model'].trim() : '';
    if (!isOllamaModelName(model)) {
      return {
        ok: false,
        error: 'model must be an Ollama model name, such as qwen3.5:9b'
      };
    }
    settings.model = model;
  }
  return { ok: true, settings };
}

/**
 * Whether Ollama's model list has `model`. A name without a tag means
 * `:latest`, as in `ollama pull`.
 */
export function hasOllamaModel(
  models: readonly string[],
  model: string
): boolean {
  const withTag = model.includes(':') ? model : `${model}:latest`;
  return models.some((name) => name === model || name === withTag);
}

/** The terminal command that downloads `model`. */
export function ollamaPullCommand(model: string): string {
  return `ollama pull ${model}`;
}
