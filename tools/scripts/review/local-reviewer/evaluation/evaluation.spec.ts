import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { buildPrefilterContext } from '../prefilter/prefilter.ts';
import {
  DEFAULT_SMALL_DIFF_THRESHOLD_CHARS,
  type EvaluationLocalResult,
  type LocalReviewFinding,
  type LocalReviewReport,
} from '../shared/shared.ts';
import {
  selectAbSamples,
  selectEvaluationSamples,
  summarizeEvaluation,
} from './evaluation.ts';

test('selectAbSamples prefers typed coverage before filling the remainder', () => {
  const results = selectAbSamples([
    sample('small-ts', 'a'),
    sample('multi-file-refactor', 'b'),
    sample('workspace-config', 'c'),
    sample('higher-risk', 'd'),
    sample('general', 'e'),
  ]);

  assert.deepEqual(
    results.map((entry) => entry.kind),
    ['small-ts', 'multi-file-refactor', 'workspace-config', 'higher-risk'],
  );
});

test('selectEvaluationSamples backfills with remaining kinds when a soft quota is missing', () => {
  const selected = selectEvaluationSamples({
    candidates: [
      sample('small-ts', 'a'),
      sample('small-ts', 'b'),
      sample('general', 'c'),
      sample('general', 'd'),
      sample('multi-file-refactor', 'e'),
    ],
    rounds: 4,
    seed: 1,
  });

  assert.equal(selected.length, 4);
  assert.deepEqual(selected.map((entry) => entry.kind).sort(), [
    'general',
    'multi-file-refactor',
    'small-ts',
    'small-ts',
  ]);
});

test('summarizeEvaluation writes evaluation artifacts and verdicts', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'local-reviewer-eval-'));

  try {
    const report = reviewReport([]);
    const localResults: EvaluationLocalResult[] = [
      {
        durationMs: 10,
        findingsCount: 0,
        jsonParseable: true,
        diffLength: 20,
        paidReviewContextLength: 0,
        prefilterContextLength: 10,
        recommendedEscalation: false,
        escalationReasons: [],
        report,
        reviewContextLength: 10,
        reviewContextMode: 'prefilter-summary',
        sample: sample('small-ts', '1111111'),
        success: true,
        summaryLength: buildPrefilterContext({
          diffText: '@@\n+const value = 1;',
          escalationReasons: [],
          findings: [],
          report,
        }).length,
      },
    ];

    const output = summarizeEvaluation({
      config: {
        abSampleCount: 0,
        jobs: 2,
        repoNames: ['gx.law-prep'],
        rounds: 1,
        seed: 1,
        smallDiffThresholdChars: DEFAULT_SMALL_DIFF_THRESHOLD_CHARS,
      },
      localResults,
      reviewerResults: [],
      repoRoot: workspace,
    });

    assert.match(output.summaryMarkdown, /usable-prefilter/);
    assert.match(output.summaryMarkdown, /Local parallel jobs: 2/);
    assert.match(
      output.summaryMarkdown,
      /Estimated paid review context chars: 0\/20/,
    );
    assert.equal(existsSync(output.artifacts.summaryPath), true);
    assert.equal(existsSync(output.artifacts.samplesPath), true);
  } finally {
    rmSync(workspace, { force: true, recursive: true });
  }
});

function sample(
  kind:
    | 'small-ts'
    | 'multi-file-refactor'
    | 'workspace-config'
    | 'higher-risk'
    | 'general',
  commit: string,
) {
  return {
    baseRef: 'base',
    commit,
    committedAtEpoch: 1,
    fileCount: 1,
    kind,
    repoName: 'gx.law-prep',
    repoRoot: '/repo',
    subject: `sample ${commit}`,
    totalChangedLines: 10,
  };
}

function reviewReport(findings: LocalReviewFinding[]): LocalReviewReport {
  return {
    generated_at: new Date(0).toISOString(),
    context: {
      repo_root: '/repo',
      base_ref: null,
      head_ref: null,
      staged: true,
      requested_profiles: [],
      config_source: '/repo/local-reviewer.toml',
      files: [
        {
          path: 'src/index.ts',
          status: 'modified',
          old_path: null,
          language: 'typescript',
          patch: '@@\n+const value = 1;\n',
        },
      ],
    },
    profiles: [{ name: 'typescript', description: 'TypeScript' }],
    findings,
    trace: ['Intake', 'Route', 'Synthesis'],
    summary: 'Reviewed 1 file(s).',
    model_used: 'qwen3:8b',
    runtime_provider: 'ollama',
    advisory_only: true,
  };
}
