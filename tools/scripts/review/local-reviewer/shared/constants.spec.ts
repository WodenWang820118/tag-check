import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EVALUATION_REPO_NAMES,
  DEFAULT_HYBRID_GPT_MODEL,
  DEFAULT_OLLAMA_HOST,
  DEFAULT_OLLAMA_MODEL,
  EVALUATION_KIND_ORDER,
  EVALUATION_KIND_WEIGHTS,
  HYBRID_ANGULAR_PATH_PATTERNS,
  HYBRID_NEST_PATH_PATTERNS,
  HYBRID_PROFILE_ORDER,
  HYBRID_REPO_HABITS_PATH_PATTERNS,
  HYBRID_TYPESCRIPT_PATH_PATTERNS,
  MAX_HYBRID_GPT_DIFF_CHARS,
  PREFILTER_ARTIFACT_DIR,
  SENSITIVE_REVIEW_AREAS,
  WINDOWS_PROCESS_BRIDGE_ENV,
  WINDOWS_PROCESS_BRIDGE_SCRIPT
} from './constants.ts';

describe('local-reviewer constants', () => {
  it('exposes a localhost ollama host and a non-empty default model', () => {
    expect(DEFAULT_OLLAMA_HOST.startsWith('http://127.0.0.1')).toBe(true);
    expect(DEFAULT_OLLAMA_MODEL.length).toBeGreaterThan(0);
    expect(DEFAULT_HYBRID_GPT_MODEL.length).toBeGreaterThan(0);
  });

  it('caps hybrid GPT diff size at the documented threshold', () => {
    expect(MAX_HYBRID_GPT_DIFF_CHARS).toBe(8_000);
  });

  it('lists every evaluation kind exactly once with a positive weight', () => {
    const seen = new Set<string>();
    for (const kind of EVALUATION_KIND_ORDER) {
      expect(seen.has(kind)).toBe(false);
      seen.add(kind);
      expect(EVALUATION_KIND_WEIGHTS[kind]).toBeGreaterThan(0);
    }
    expect(Object.keys(EVALUATION_KIND_WEIGHTS).sort()).toEqual(
      [...EVALUATION_KIND_ORDER].sort()
    );
  });

  it('keeps tag-check at the head of the evaluation repo list', () => {
    expect(DEFAULT_EVALUATION_REPO_NAMES[0]).toBe('tag-check');
  });

  it('orders hybrid profiles so general is the final fallback', () => {
    expect(HYBRID_PROFILE_ORDER.at(-1)).toBe('general');
    expect(HYBRID_PROFILE_ORDER).toContain('angular');
    expect(HYBRID_PROFILE_ORDER).toContain('nest');
  });

  it('routes the prefilter artifact directory under .cache/reviews', () => {
    expect(PREFILTER_ARTIFACT_DIR).toEqual([
      '.cache',
      'reviews',
      'local-reviewer'
    ]);
  });
});

describe('SENSITIVE_REVIEW_AREAS patterns', () => {
  it.each([
    ['auth', 'updates oauth login session'],
    ['secrets', 'reads SECRET token'],
    ['filesystem', 'calls readFile and writeFile'],
    ['shell', 'spawns child_process spawnSync'],
    ['network', 'invokes fetch( and axios'],
    ['public contract', 'updates controller and dto'],
    ['persistent state', 'runs database migration via prisma']
  ] as const)('matches %s text', (category, sample) => {
    const entry = SENSITIVE_REVIEW_AREAS.find(
      (item) => item.category === category
    );
    expect(entry).toBeDefined();
    expect(entry?.pattern.test(sample)).toBe(true);
  });
});

describe('hybrid path patterns', () => {
  it('matches Angular component, html, and scss files', () => {
    expect(
      HYBRID_ANGULAR_PATH_PATTERNS.some((p) => p.test('foo.component.ts'))
    ).toBe(true);
    expect(HYBRID_ANGULAR_PATH_PATTERNS.some((p) => p.test('foo.html'))).toBe(
      true
    );
    expect(HYBRID_ANGULAR_PATH_PATTERNS.some((p) => p.test('foo.scss'))).toBe(
      true
    );
  });

  it('matches Nest controller and module files', () => {
    expect(
      HYBRID_NEST_PATH_PATTERNS.some((p) => p.test('foo.controller.ts'))
    ).toBe(true);
    expect(
      HYBRID_NEST_PATH_PATTERNS.some((p) => p.test('apps/api/src/foo.ts'))
    ).toBe(true);
  });

  it('matches typescript file extensions', () => {
    for (const ext of ['ts', 'tsx', 'mts', 'cts']) {
      expect(
        HYBRID_TYPESCRIPT_PATH_PATTERNS.some((p) => p.test(`foo.${ext}`))
      ).toBe(true);
    }
  });

  it('matches repo habit configuration files', () => {
    for (const file of [
      'package.json',
      'pnpm-workspace.yaml',
      'nx.json',
      'tsconfig.base.json',
      'README.md'
    ]) {
      expect(HYBRID_REPO_HABITS_PATH_PATTERNS.some((p) => p.test(file))).toBe(
        true
      );
    }
  });
});

describe('windows process bridge constants', () => {
  it('exposes the env var name expected by the PowerShell bridge', () => {
    expect(WINDOWS_PROCESS_BRIDGE_ENV).toBe(
      'LOCAL_REVIEWER_WINDOWS_PROCESS_JSON_PATH'
    );
    expect(WINDOWS_PROCESS_BRIDGE_SCRIPT).toContain(WINDOWS_PROCESS_BRIDGE_ENV);
    expect(WINDOWS_PROCESS_BRIDGE_SCRIPT).toContain('exit $LASTEXITCODE');
  });
});
