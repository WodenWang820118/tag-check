import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildPrefilterFailureContext,
  getEscalationReasons,
  selectPaidReviewContext,
  writePrefilterArtifacts
} from './prefilter.ts';
import { DEFAULT_SMALL_DIFF_THRESHOLD_CHARS } from '../shared/shared.ts';

test('getEscalationReasons detects high severity and sensitive paths', () => {
  const reasons = getEscalationReasons({
    diffText: '+ execSync("rm -rf /")',
    fileCount: 3,
    findings: [
      {
        severity: 'high',
        title: 'Shell execution',
        detail: 'Uses execSync.',
        file_path: 'tools/scripts/review/local-reviewer/local-reviewer.ts',
        line: 3,
        recommendation: null,
        profile: 'typescript',
        rationale: null,
        evidence: null
      }
    ],
    changedFiles: ['src/shell/auth.service.ts']
  });

  assert.match(reasons.join(' '), /critical\/high/i);
  assert.match(reasons.join(' '), /sensitive area detected/i);
});

test('writePrefilterArtifacts persists both report and context', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'local-reviewer-prefilter-'));

  try {
    const reviewContextSelection = selectPaidReviewContext({
      diffText: '@@\n+const value = 1;',
      prefilterContext: '# Prefilter'
    });
    const artifacts = writePrefilterArtifacts({
      repoRoot: workspace,
      contextMarkdown: '# Prefilter',
      reportPayload: { ok: true },
      reviewContextSelection
    });

    assert.equal(existsSync(artifacts.contextPath), true);
    assert.equal(existsSync(artifacts.reportPath), true);
    assert.equal(existsSync(artifacts.reviewContextPath), true);
    assert.equal(readFileSync(artifacts.contextPath, 'utf8'), '# Prefilter\n');
    assert.equal(
      readFileSync(artifacts.reviewContextPath, 'utf8'),
      '@@\n+const value = 1;\n'
    );
    assert.deepEqual(JSON.parse(readFileSync(artifacts.reportPath, 'utf8')), {
      ok: true
    });
  } finally {
    rmSync(workspace, { force: true, recursive: true });
  }
});

test('selectPaidReviewContext uses the full diff for small diffs', () => {
  const selection = selectPaidReviewContext({
    diffText: 'abcd',
    prefilterContext: '# Prefilter\n\nThis summary is longer than the diff.',
    smallDiffThresholdChars: DEFAULT_SMALL_DIFF_THRESHOLD_CHARS
  });

  assert.equal(selection.mode, 'full-diff');
  assert.equal(selection.contextText, 'abcd');
});

test('selectPaidReviewContext falls back to the full diff when the summary is not smaller', () => {
  const selection = selectPaidReviewContext({
    diffText: '0123456789abcdef',
    prefilterContext: '0123456789abcdef more context',
    smallDiffThresholdChars: 4
  });

  assert.equal(selection.mode, 'full-diff');
  assert.equal(selection.contextLength, 16);
});

test('buildPrefilterFailureContext records the local runtime failure', () => {
  const context = buildPrefilterFailureContext({
    changedFiles: ['src/app.ts'],
    diffText: '@@\n+throw new Error()',
    escalationReasons: ['local runtime failure: timed out'],
    localReviewError: 'timed out'
  });

  assert.match(context, /local reviewer failed/i);
  assert.match(context, /local runtime failure: timed out/i);
});

test('getEscalationReasons returns nothing for a clean small diff', () => {
  assert.deepEqual(
    getEscalationReasons({
      changedFiles: ['README.md'],
      diffText: 'noop',
      fileCount: 1,
      findings: []
    }),
    []
  );
});

test('getEscalationReasons reports a local runtime failure first', () => {
  const reasons = getEscalationReasons({
    changedFiles: ['a.ts'],
    diffText: '',
    fileCount: 1,
    findings: [],
    localReviewError: 'spawn ENOENT'
  });

  assert.equal(reasons[0], 'local runtime failure: spawn ENOENT');
});

test('getEscalationReasons flags diffs touching more than 15 files', () => {
  const reasons = getEscalationReasons({
    changedFiles: [],
    diffText: '',
    fileCount: 20,
    findings: []
  });

  assert.ok(reasons.includes('diff touches 20 files'));
});

test('getEscalationReasons lists each sensitive category once', () => {
  const reasons = getEscalationReasons({
    changedFiles: [],
    diffText: 'auth login auth oauth',
    fileCount: 1,
    findings: []
  });
  const sensitive = reasons.find((reason) =>
    reason.startsWith('sensitive area detected:')
  );

  assert.equal(sensitive?.match(/auth/g)?.length, 1);
});

test('selectPaidReviewContext keeps the full diff when forced, even for huge diffs', () => {
  const selection = selectPaidReviewContext({
    diffText: 'x'.repeat(5000),
    forceFullDiff: true,
    prefilterContext: 'short',
    smallDiffThresholdChars: 100
  });

  assert.equal(selection.mode, 'full-diff');
  assert.equal(selection.originalDiffLength, 5000);
});

test('selectPaidReviewContext keeps the full diff when the prefilter context is empty', () => {
  const selection = selectPaidReviewContext({
    diffText: 'x'.repeat(5000),
    prefilterContext: '',
    smallDiffThresholdChars: 100
  });

  assert.equal(selection.mode, 'full-diff');
});

test('selectPaidReviewContext switches to the prefilter summary for a large diff', () => {
  const selection = selectPaidReviewContext({
    diffText: 'x'.repeat(5000),
    prefilterContext: 'short summary',
    smallDiffThresholdChars: 100
  });

  assert.equal(selection.mode, 'prefilter-summary');
  assert.equal(selection.contextText, 'short summary');
  assert.equal(selection.originalDiffLength, 5000);
});

test('selectPaidReviewContext defaults the threshold to DEFAULT_SMALL_DIFF_THRESHOLD_CHARS', () => {
  const selection = selectPaidReviewContext({
    diffText: 'x'.repeat(500),
    prefilterContext: 'short'
  });

  assert.equal(
    selection.smallDiffThresholdChars,
    DEFAULT_SMALL_DIFF_THRESHOLD_CHARS
  );
  assert.equal(selection.mode, 'full-diff');
});

test('buildPrefilterFailureContext lists reasons and files with "- none" findings', () => {
  const text = buildPrefilterFailureContext({
    changedFiles: ['a.ts', 'b.ts'],
    diffText: 'unused',
    escalationReasons: ['runtime down'],
    localReviewError: 'EACCES'
  });

  assert.match(text, /runtime=unavailable/);
  assert.match(text, /recommended_escalation=yes/);
  assert.match(text, /- runtime down/);
  assert.match(text, /- a\.ts/);
  assert.match(text, /- b\.ts/);
  assert.match(text, /findings:\n- none/);
});

test('buildPrefilterFailureContext renders "- none" when there are no changed files', () => {
  const text = buildPrefilterFailureContext({
    changedFiles: [],
    diffText: '',
    escalationReasons: [],
    localReviewError: 'boom'
  });

  assert.match(text, /files:\n- none/);
});

test('buildPrefilterFailureContext truncates the file list to 8 entries', () => {
  const text = buildPrefilterFailureContext({
    changedFiles: Array.from({ length: 12 }, (_, index) => `f${index}.ts`),
    diffText: '',
    escalationReasons: [],
    localReviewError: 'boom'
  });

  assert.match(text, /- f7\.ts/);
  assert.doesNotMatch(text, /- f8\.ts/);
  assert.match(text, /- \.\.\. 4 more file\(s\)/);
});
