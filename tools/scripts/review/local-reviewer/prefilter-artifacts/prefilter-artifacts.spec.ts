import { describe, expect, it } from 'vitest';
import {
  buildPrefilterFailureContext,
  getEscalationReasons,
  selectPaidReviewContext
} from './prefilter-artifacts.ts';
import type { LocalReviewFinding } from '../shared/shared.ts';

function makeFinding(
  partial: Partial<LocalReviewFinding> = {}
): LocalReviewFinding {
  return {
    severity: 'medium',
    title: 'sample',
    detail: 'detail',
    file_path: null,
    line: null,
    recommendation: null,
    profile: null,
    rationale: null,
    evidence: null,
    ...partial
  };
}

describe('getEscalationReasons', () => {
  it('returns an empty list for a clean small diff with no findings', () => {
    expect(
      getEscalationReasons({
        diffText: 'noop',
        fileCount: 1,
        findings: [],
        changedFiles: ['README.md']
      })
    ).toEqual([]);
  });

  it('reports a local runtime failure first when localReviewError is set', () => {
    const reasons = getEscalationReasons({
      diffText: '',
      fileCount: 1,
      findings: [],
      changedFiles: ['a.ts'],
      localReviewError: 'spawn ENOENT'
    });
    expect(reasons[0]).toBe('local runtime failure: spawn ENOENT');
  });

  it('flags critical/high findings', () => {
    const reasons = getEscalationReasons({
      diffText: '',
      fileCount: 1,
      findings: [makeFinding({ severity: 'high' })],
      changedFiles: ['a.ts']
    });
    expect(reasons).toContain(
      'local reviewer reported a critical/high finding'
    );
  });

  it('flags large diffs (>15 files)', () => {
    const reasons = getEscalationReasons({
      diffText: '',
      fileCount: 20,
      findings: [],
      changedFiles: []
    });
    expect(reasons).toContain('diff touches 20 files');
  });

  it('detects sensitive areas via SENSITIVE_REVIEW_AREAS patterns', () => {
    const reasons = getEscalationReasons({
      diffText: 'something with jwt token logic',
      fileCount: 1,
      findings: [],
      changedFiles: ['src/index.ts']
    });
    const sensitive = reasons.find((reason) =>
      reason.startsWith('sensitive area detected:')
    );
    expect(sensitive).toBeDefined();
    expect(sensitive).toMatch(/auth/);
    expect(sensitive).toMatch(/secrets/);
  });

  it('deduplicates sensitive area categories', () => {
    const reasons = getEscalationReasons({
      diffText: 'auth login auth oauth',
      fileCount: 1,
      findings: [],
      changedFiles: []
    });
    const sensitive = reasons.find((reason) =>
      reason.startsWith('sensitive area detected:')
    );
    expect(sensitive?.match(/auth/g)?.length).toBe(1);
  });
});

describe('selectPaidReviewContext', () => {
  it('returns full-diff for diffs at or under the small-diff threshold', () => {
    const result = selectPaidReviewContext({
      diffText: 'small diff',
      prefilterContext: 'a much longer prefilter summary that exists',
      smallDiffThresholdChars: 1024
    });
    expect(result.mode).toBe('full-diff');
    expect(result.contextText).toBe('small diff');
  });

  it('returns full-diff when forceFullDiff is true even for huge diffs', () => {
    const result = selectPaidReviewContext({
      diffText: 'x'.repeat(5000),
      forceFullDiff: true,
      prefilterContext: 'short',
      smallDiffThresholdChars: 100
    });
    expect(result.mode).toBe('full-diff');
    expect(result.originalDiffLength).toBe(5000);
  });

  it('returns full-diff when prefilter context is empty', () => {
    const result = selectPaidReviewContext({
      diffText: 'x'.repeat(5000),
      prefilterContext: '',
      smallDiffThresholdChars: 100
    });
    expect(result.mode).toBe('full-diff');
  });

  it('returns prefilter-summary when prefilter context is shorter than the large diff', () => {
    const result = selectPaidReviewContext({
      diffText: 'x'.repeat(5000),
      prefilterContext: 'short summary',
      smallDiffThresholdChars: 100
    });
    expect(result.mode).toBe('prefilter-summary');
    expect(result.contextText).toBe('short summary');
    expect(result.originalDiffLength).toBe(5000);
  });

  it('defaults to DEFAULT_SMALL_DIFF_THRESHOLD_CHARS (1024) when threshold is omitted', () => {
    const result = selectPaidReviewContext({
      diffText: 'x'.repeat(500),
      prefilterContext: 'short'
    });
    expect(result.smallDiffThresholdChars).toBe(1024);
    expect(result.mode).toBe('full-diff');
  });
});

describe('buildPrefilterFailureContext', () => {
  it('emits an unavailable runtime block with reasons and "- none" findings', () => {
    const text = buildPrefilterFailureContext({
      changedFiles: ['a.ts', 'b.ts'],
      diffText: 'unused',
      escalationReasons: ['runtime down'],
      localReviewError: 'EACCES'
    });
    expect(text).toContain('runtime=unavailable');
    expect(text).toContain('summary=local reviewer failed before producing');
    expect(text).toContain('recommended_escalation=yes');
    expect(text).toContain('- runtime down');
    expect(text).toContain('- a.ts');
    expect(text).toContain('- b.ts');
    expect(text).toContain('findings:\n- none');
  });

  it('renders "- none" under files when changedFiles is empty', () => {
    const text = buildPrefilterFailureContext({
      changedFiles: [],
      diffText: '',
      escalationReasons: [],
      localReviewError: 'boom'
    });
    expect(text).toContain('files:\n- none');
  });

  it('truncates the file list to 8 entries with a "more file(s)" suffix', () => {
    const changedFiles = Array.from({ length: 12 }, (_, i) => `f${i}.ts`);
    const text = buildPrefilterFailureContext({
      changedFiles,
      diffText: '',
      escalationReasons: [],
      localReviewError: 'boom'
    });
    expect(text).toContain('- f7.ts');
    expect(text).not.toContain('- f8.ts');
    expect(text).toContain('- ... 4 more file(s)');
  });
});
