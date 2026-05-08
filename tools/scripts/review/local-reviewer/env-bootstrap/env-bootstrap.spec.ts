import { describe, expect, it } from 'vitest';
import {
  buildWindowsProcessBridgePayload,
  createLocalReviewerEnv
} from './env-bootstrap.ts';

describe('buildWindowsProcessBridgePayload', () => {
  it('echoes command and args, defaulting cwd to process.cwd()', () => {
    const result = buildWindowsProcessBridgePayload({
      args: ['--flag', 'value'],
      command: 'pnpm.cmd'
    });
    expect(result.command).toBe('pnpm.cmd');
    expect(result.args).toEqual(['--flag', 'value']);
    expect(result.cwd).toBe(process.cwd());
  });

  it('uses the supplied cwd when given', () => {
    const result = buildWindowsProcessBridgePayload({
      args: [],
      command: 'pnpm.cmd',
      cwd: '/tmp/work'
    });
    expect(result.cwd).toBe('/tmp/work');
  });

  it('returns a fresh args array (does not retain caller reference)', () => {
    const args = ['a', 'b'];
    const result = buildWindowsProcessBridgePayload({ args, command: 'x' });
    expect(result.args).not.toBe(args);
    args.push('c');
    expect(result.args).toEqual(['a', 'b']);
  });
});

describe('createLocalReviewerEnv', () => {
  it('fills in all LOCAL_REVIEWER defaults when baseEnv is empty', () => {
    const env = createLocalReviewerEnv({});
    expect(env.LOCAL_REVIEWER_RUNTIME).toBe('ollama');
    expect(env.LOCAL_REVIEWER_OLLAMA_HOST).toBe('http://127.0.0.1:11434');
    expect(env.LOCAL_REVIEWER_OLLAMA_KEEP_ALIVE).toBe('10m');
    expect(env.LOCAL_REVIEWER_OLLAMA_MODEL).toBe('qwen3:8b');
    expect(env.LOCAL_REVIEWER_DEFAULT_MODEL).toBe('qwen3:8b');
    expect(env.LOCAL_REVIEWER_OLLAMA_THINK).toBe('false');
    expect(env.LOCAL_REVIEWER_OLLAMA_TIMEOUT_MS).toBe('120000');
  });

  it('keeps existing baseEnv values for keys it would otherwise default', () => {
    const env = createLocalReviewerEnv({
      LOCAL_REVIEWER_RUNTIME: 'foundry',
      LOCAL_REVIEWER_OLLAMA_HOST: 'http://other:1',
      LOCAL_REVIEWER_OLLAMA_KEEP_ALIVE: '1h',
      LOCAL_REVIEWER_OLLAMA_THINK: 'true',
      LOCAL_REVIEWER_OLLAMA_TIMEOUT_MS: '60000'
    });
    expect(env.LOCAL_REVIEWER_RUNTIME).toBe('foundry');
    expect(env.LOCAL_REVIEWER_OLLAMA_HOST).toBe('http://other:1');
    expect(env.LOCAL_REVIEWER_OLLAMA_KEEP_ALIVE).toBe('1h');
    expect(env.LOCAL_REVIEWER_OLLAMA_THINK).toBe('true');
    expect(env.LOCAL_REVIEWER_OLLAMA_TIMEOUT_MS).toBe('60000');
  });

  it('lets overrides win over baseEnv values', () => {
    const env = createLocalReviewerEnv(
      { LOCAL_REVIEWER_RUNTIME: 'ollama' },
      { LOCAL_REVIEWER_RUNTIME: 'foundry' }
    );
    expect(env.LOCAL_REVIEWER_RUNTIME).toBe('foundry');
  });

  it('resolves LOCAL_REVIEWER_OLLAMA_MODEL from overrides.OLLAMA_MODEL first', () => {
    const env = createLocalReviewerEnv(
      { LOCAL_REVIEWER_DEFAULT_MODEL: 'base-default' },
      { LOCAL_REVIEWER_OLLAMA_MODEL: 'override-model' }
    );
    expect(env.LOCAL_REVIEWER_OLLAMA_MODEL).toBe('override-model');
    // DEFAULT_MODEL keeps the baseEnv value when only the Ollama-specific override is supplied
    expect(env.LOCAL_REVIEWER_DEFAULT_MODEL).toBe('base-default');
  });

  it('falls back to overrides.LOCAL_REVIEWER_DEFAULT_MODEL when no Ollama-specific override', () => {
    const env = createLocalReviewerEnv(
      {},
      { LOCAL_REVIEWER_DEFAULT_MODEL: 'overridden-default' }
    );
    expect(env.LOCAL_REVIEWER_OLLAMA_MODEL).toBe('overridden-default');
    expect(env.LOCAL_REVIEWER_DEFAULT_MODEL).toBe('overridden-default');
  });

  it('falls back to baseEnv ollama model before baseEnv default model', () => {
    const env = createLocalReviewerEnv({
      LOCAL_REVIEWER_OLLAMA_MODEL: 'base-ollama',
      LOCAL_REVIEWER_DEFAULT_MODEL: 'base-default'
    });
    expect(env.LOCAL_REVIEWER_OLLAMA_MODEL).toBe('base-ollama');
  });

  it('preserves unrelated baseEnv keys verbatim', () => {
    const env = createLocalReviewerEnv({ PATH: '/usr/bin', HOME: '/home/me' });
    expect(env.PATH).toBe('/usr/bin');
    expect(env.HOME).toBe('/home/me');
  });
});
