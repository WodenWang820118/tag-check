import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildPrefilterFailureContext,
  getEscalationReasons,
  selectPaidReviewContext,
  writePrefilterArtifacts,
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
        evidence: null,
      },
    ],
    changedFiles: ['src/shell/auth.service.ts'],
  });

  assert.match(reasons.join(' '), /critical\/high/i);
  assert.match(reasons.join(' '), /sensitive area detected/i);
});

test('writePrefilterArtifacts persists both report and context', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'local-reviewer-prefilter-'));

  try {
    const reviewContextSelection = selectPaidReviewContext({
      diffText: '@@\n+const value = 1;',
      prefilterContext: '# Prefilter',
    });
    const artifacts = writePrefilterArtifacts({
      repoRoot: workspace,
      contextMarkdown: '# Prefilter',
      reportPayload: { ok: true },
      reviewContextSelection,
    });

    assert.equal(existsSync(artifacts.contextPath), true);
    assert.equal(existsSync(artifacts.reportPath), true);
    assert.equal(existsSync(artifacts.reviewContextPath), true);
    assert.equal(readFileSync(artifacts.contextPath, 'utf8'), '# Prefilter\n');
    assert.equal(
      readFileSync(artifacts.reviewContextPath, 'utf8'),
      '@@\n+const value = 1;\n',
    );
    assert.deepEqual(JSON.parse(readFileSync(artifacts.reportPath, 'utf8')), {
      ok: true,
    });
  } finally {
    rmSync(workspace, { force: true, recursive: true });
  }
});

test('selectPaidReviewContext uses the full diff for small diffs', () => {
  const selection = selectPaidReviewContext({
    diffText: 'abcd',
    prefilterContext: '# Prefilter\n\nThis summary is longer than the diff.',
    smallDiffThresholdChars: DEFAULT_SMALL_DIFF_THRESHOLD_CHARS,
  });

  assert.equal(selection.mode, 'full-diff');
  assert.equal(selection.contextText, 'abcd');
});

test('selectPaidReviewContext falls back to the full diff when the summary is not smaller', () => {
  const selection = selectPaidReviewContext({
    diffText: '0123456789abcdef',
    prefilterContext: '0123456789abcdef more context',
    smallDiffThresholdChars: 4,
  });

  assert.equal(selection.mode, 'full-diff');
  assert.equal(selection.contextLength, 16);
});

test('buildPrefilterFailureContext records the local runtime failure', () => {
  const context = buildPrefilterFailureContext({
    changedFiles: ['src/app.ts'],
    diffText: '@@\n+throw new Error()',
    escalationReasons: ['local runtime failure: timed out'],
    localReviewError: 'timed out',
  });

  assert.match(context, /local reviewer failed/i);
  assert.match(context, /local runtime failure: timed out/i);
});
