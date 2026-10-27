import { describe, expect, it } from 'vitest';
import {
  hasOllamaModel,
  isOllamaModelName,
  normalizeOllamaUrl,
  ollamaPullCommand,
  validateAiAssistSettings
} from './ai-assist-settings';

describe('normalizeOllamaUrl', () => {
  it.each([
    ['http://127.0.0.1:11434', 'http://127.0.0.1:11434'],
    ['http://localhost:11434/', 'http://localhost:11434'],
    [' https://[::1]:8443 ', 'https://[::1]:8443']
  ])('accepts %s on this computer', (value, expected) => {
    expect(normalizeOllamaUrl(value)).toBe(expected);
  });

  it.each([
    'http://192.168.1.20:11434',
    'http://ollama.example.com',
    'ftp://127.0.0.1:11434',
    'http://user:secret@127.0.0.1:11434',
    'http://127.0.0.1:11434/api',
    'http://127.0.0.1:11434?x=1',
    'http://127.0.0.1:11434#top',
    'not a url'
  ])('rejects %s', (value) => {
    expect(normalizeOllamaUrl(value)).toBeNull();
  });
});

describe('isOllamaModelName', () => {
  it.each(['qwen3.5:9b', 'llama3', 'richardyoung/qwythos-9b:latest'])(
    'accepts %s',
    (name) => {
      expect(isOllamaModelName(name)).toBe(true);
    }
  );

  it.each(['', 'qwen; rm -rf ~', 'a b', ':9b', `${'a'.repeat(201)}`])(
    'rejects %j',
    (name) => {
      expect(isOllamaModelName(name)).toBe(false);
    }
  );
});

describe('validateAiAssistSettings', () => {
  it('keeps the given fields, normalized, and drops unknown ones', () => {
    expect(
      validateAiAssistSettings({
        enabled: true,
        ollamaUrl: 'http://localhost:11434/',
        model: ' qwen3.5:4b ',
        extra: 1
      })
    ).toEqual({
      ok: true,
      settings: {
        enabled: true,
        ollamaUrl: 'http://localhost:11434',
        model: 'qwen3.5:4b'
      }
    });
  });

  it('accepts an empty body', () => {
    expect(validateAiAssistSettings({})).toEqual({ ok: true, settings: {} });
  });

  it.each([
    [null, 'The body must be an object'],
    [[], 'The body must be an object'],
    [{ enabled: 'yes' }, 'enabled must be true or false'],
    [{ ollamaUrl: 'http://10.0.0.2:11434' }, 'ollamaUrl must be'],
    [{ ollamaUrl: 11434 }, 'ollamaUrl must be'],
    [{ model: 'qwen && calc' }, 'model must be'],
    [{ model: 9 }, 'model must be']
  ])('rejects %j', (body, error) => {
    const result = validateAiAssistSettings(body);
    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.error).toContain(error);
  });
});

describe('hasOllamaModel', () => {
  const models = ['qwen3.5:9b', 'llama3:latest'];

  it('finds a model by its full name', () => {
    expect(hasOllamaModel(models, 'qwen3.5:9b')).toBe(true);
    expect(hasOllamaModel(models, 'qwen3.5:4b')).toBe(false);
  });

  it('reads a name without a tag as :latest', () => {
    expect(hasOllamaModel(models, 'llama3')).toBe(true);
    expect(hasOllamaModel(models, 'qwen3.5')).toBe(false);
  });
});

describe('ollamaPullCommand', () => {
  it('is the command that downloads the model', () => {
    expect(ollamaPullCommand('qwen3.5:9b')).toBe('ollama pull qwen3.5:9b');
  });
});
