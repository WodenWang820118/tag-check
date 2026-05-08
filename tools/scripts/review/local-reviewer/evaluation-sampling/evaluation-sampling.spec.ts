import { describe, expect, it } from 'vitest';
import {
  buildCheckpointReviewContext,
  selectAbSamples
} from './evaluation-sampling.ts';
import type { EvaluationSample } from '../shared/shared.ts';

function makeSample(
  partial: Partial<EvaluationSample> & Pick<EvaluationSample, 'kind'>
): EvaluationSample {
  return {
    baseRef: 'base',
    commit: 'abcdef0',
    committedAtEpoch: 0,
    fileCount: 1,
    repoName: 'repo',
    repoRoot: '/repo',
    subject: 's',
    totalChangedLines: 10,
    ...partial
  };
}

describe('buildCheckpointReviewContext', () => {
  it('renders a multi-line context block with metadata, files, and diff', () => {
    const text = buildCheckpointReviewContext({
      changedFiles: ['src/a.ts', 'src\\b.ts'],
      diffText: '  diff body  \n',
      sample: makeSample({
        baseRef: 'main',
        commit: 'cafe123',
        kind: 'small-ts',
        repoName: 'demo',
        subject: 'feat: do thing'
      })
    });
    expect(text).toContain('Repository: demo');
    expect(text).toContain('Commit: cafe123');
    expect(text).toContain('Base ref: main');
    expect(text).toContain('Head ref: cafe123');
    expect(text).toContain('Subject: feat: do thing');
    expect(text).toContain('Kind: small-ts');
    expect(text).toContain('Changed files:');
    expect(text).toContain('- src/a.ts');
    // hybrid path normalization should convert backslashes to forward slashes
    expect(text).toContain('- src/b.ts');
    expect(text).toContain('Diff to review:');
    expect(text).toContain('diff body');
    // diff text is trimmed
    expect(text.endsWith('diff body')).toBe(true);
  });
});

describe('selectAbSamples', () => {
  it('returns an empty array when desiredCount <= 0', () => {
    expect(selectAbSamples([makeSample({ kind: 'small-ts' })], 0)).toEqual([]);
    expect(selectAbSamples([makeSample({ kind: 'small-ts' })], -1)).toEqual([]);
  });

  it('returns at most desiredCount samples', () => {
    const samples = [
      makeSample({ kind: 'small-ts', commit: 'a' }),
      makeSample({ kind: 'small-ts', commit: 'b' }),
      makeSample({ kind: 'general', commit: 'c' })
    ];
    expect(selectAbSamples(samples, 2)).toHaveLength(2);
  });

  it('picks one of each kind in preferred order before duplicating any kind', () => {
    const samples = [
      makeSample({ kind: 'general', commit: 'g1' }),
      makeSample({ kind: 'higher-risk', commit: 'h1' }),
      makeSample({ kind: 'workspace-config', commit: 'w1' }),
      makeSample({ kind: 'multi-file-refactor', commit: 'm1' }),
      makeSample({ kind: 'small-ts', commit: 's1' })
    ];
    const selected = selectAbSamples(samples, 4);
    expect(selected.map((sample) => sample.kind)).toEqual([
      'small-ts',
      'multi-file-refactor',
      'workspace-config',
      'higher-risk'
    ]);
  });

  it('falls back to remaining samples in order when preferred kinds are exhausted', () => {
    const samples = [
      makeSample({ kind: 'small-ts', commit: 's1' }),
      makeSample({ kind: 'small-ts', commit: 's2' }),
      makeSample({ kind: 'general', commit: 'g1' })
    ];
    const selected = selectAbSamples(samples, 3);
    // round 1 picks small-ts (s1) and general (g1), then loop fills with remaining s2
    expect(selected.map((sample) => sample.commit)).toEqual(['s1', 'g1', 's2']);
  });

  it('returns fewer than desiredCount when input is too small', () => {
    const samples = [makeSample({ kind: 'small-ts', commit: 'only' })];
    expect(selectAbSamples(samples, 5)).toHaveLength(1);
  });
});
