import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import {
  analyzeHybridHeuristics,
  buildCheckpointReviewContext,
  buildHybridPrefilterContext,
  buildHybridReviewReport,
  createHybridGptTelemetryContext,
  createHybridGptBypassReview,
  buildPrefilterContext,
  buildPrefilterFailureContext,
  buildWindowsProcessBridgePayload,
  createLocalReviewerDependencies,
  createLocalReviewerEnv,
  DEFAULT_SMALL_DIFF_THRESHOLD_CHARS,
  getEscalationReasons,
  MAX_HYBRID_GPT_DIFF_CHARS,
  planHybridLocalReview,
  resolveLocalReviewerRepoRoot,
  selectEvaluationSamples,
  selectAbSamples,
  selectPaidReviewContext,
  summarizeEvaluation,
  writePrefilterArtifacts,
  type EvaluationLocalResult,
  type HybridGptReview,
  type LocalReviewFinding,
  type LocalReviewReport
} from './local-reviewer-support.ts';
import {
  createProviderObservationBucketKey,
  createProviderTelemetryContext
} from './provider-observability.ts';

test('resolveLocalReviewerRepoRoot finds the sibling workspace', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'local-reviewer-support-'));
  const currentRepo = resolve(workspace, 'gx.law-prep');
  const siblingRepo = resolve(workspace, 'local-reviewer-cli');

  try {
    mkdirSync(currentRepo, { recursive: true });
    mkdirSync(resolve(siblingRepo, 'packages', 'local-reviewer', 'bin'), {
      recursive: true
    });
    writeFileSync(resolve(currentRepo, 'package.json'), '{}', 'utf8');
    writeFileSync(resolve(siblingRepo, 'package.json'), '{}', 'utf8');
    writeFileSync(
      resolve(
        siblingRepo,
        'packages',
        'local-reviewer',
        'bin',
        'local-reviewer.js'
      ),
      '',
      'utf8'
    );

    assert.equal(resolveLocalReviewerRepoRoot(currentRepo), siblingRepo);
  } finally {
    rmSync(workspace, { force: true, recursive: true });
  }
});

test('resolveLocalReviewerRepoRoot respects LOCAL_REVIEWER_CLI_PATH overrides', () => {
  const workspace = mkdtempSync(join(tmpdir(), 'local-reviewer-support-env-'));
  const currentRepo = resolve(workspace, 'gx.law-prep');
  const siblingRepo = resolve(workspace, 'external', 'local-reviewer-cli');

  try {
    mkdirSync(currentRepo, { recursive: true });
    mkdirSync(resolve(siblingRepo, 'packages', 'local-reviewer', 'bin'), {
      recursive: true
    });
    writeFileSync(resolve(currentRepo, 'package.json'), '{}', 'utf8');
    writeFileSync(resolve(siblingRepo, 'package.json'), '{}', 'utf8');
    writeFileSync(
      resolve(
        siblingRepo,
        'packages',
        'local-reviewer',
        'bin',
        'local-reviewer.js'
      ),
      '',
      'utf8'
    );

    assert.equal(
      resolveLocalReviewerRepoRoot(currentRepo, {
        LOCAL_REVIEWER_CLI_PATH: siblingRepo
      }),
      siblingRepo
    );
  } finally {
    rmSync(workspace, { force: true, recursive: true });
  }
});

test('createLocalReviewerEnv injects the Ollama defaults', () => {
  const env = createLocalReviewerEnv(
    {
      PATH: process.env.PATH
    },
    {
      LOCAL_REVIEWER_OLLAMA_MODEL: 'qwen3:8b'
    }
  );

  assert.equal(env.LOCAL_REVIEWER_RUNTIME, 'ollama');
  assert.equal(env.LOCAL_REVIEWER_DEFAULT_MODEL, 'qwen3:8b');
  assert.equal(env.LOCAL_REVIEWER_OLLAMA_MODEL, 'qwen3:8b');
  assert.equal(env.LOCAL_REVIEWER_OLLAMA_THINK, 'false');
});

test('buildCheckpointReviewContext includes an explicit changed files section before the diff', () => {
  const context = buildCheckpointReviewContext({
    changedFiles: ['apps/law-prep-web/src/app/app.component.ts'],
    diffText:
      'diff --git a/apps/law-prep-web/src/app/app.component.ts b/apps/law-prep-web/src/app/app.component.ts',
    sample: {
      baseRef: 'abc123',
      commit: 'def456',
      committedAtEpoch: 0,
      fileCount: 1,
      kind: 'small-ts',
      repoName: 'gx.law-prep',
      repoRoot: 'C:/software-dev/gx.law-prep',
      subject: 'Update copy',
      totalChangedLines: 4
    }
  });

  assert.match(
    context,
    /Changed files:\n- apps\/law-prep-web\/src\/app\/app\.component\.ts\n\nDiff to review:/
  );
});

test('buildWindowsProcessBridgePayload preserves command metadata without shell flattening', () => {
  const payload = buildWindowsProcessBridgePayload({
    command: 'pnpm.cmd',
    args: ['review:implementation', '--', '--focus', 'general & risky'],
    cwd: 'C:/repo'
  });

  assert.equal(payload.command, 'pnpm.cmd');
  assert.deepEqual(payload.args, [
    'review:implementation',
    '--',
    '--focus',
    'general & risky'
  ]);
  assert.equal(payload.cwd, 'C:/repo');
});

test(
  'createLocalReviewerDependencies can execute pnpm.cmd on Windows without cmd.exe shell flattening',
  { skip: process.platform !== 'win32' },
  () => {
    const dependencies = createLocalReviewerDependencies();
    const result = dependencies.runProcess({
      command: 'pnpm.cmd',
      args: ['--version'],
      cwd: process.cwd(),
      env: { PATH: process.env.PATH },
      timeoutMs: 30000
    });

    assert.equal(result.error, undefined);
    assert.equal(result.status, 0);
    assert.equal(result.stderr.trim(), '');
  }
);

test('getEscalationReasons detects high severity and sensitive paths', () => {
  const reasons = getEscalationReasons({
    diffText: '+ execSync("rm -rf /")',
    fileCount: 3,
    findings: [
      {
        severity: 'high',
        title: 'Shell execution',
        detail: 'Uses execSync.',
        file_path: 'scripts/review.ts',
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

test('planHybridLocalReview skips local execution for a confident low-risk GPT review', () => {
  const heuristics = analyzeHybridHeuristics({
    changedFiles: ['src/utils.ts'],
    diffText: '@@\n+export const value = 1;\n'
  });

  const plan = planHybridLocalReview({
    heuristics,
    gptReview: hybridGptReview({
      confidence: 'high',
      focus_profiles: ['typescript'],
      needs_local_deep_review: false,
      overall_risk: 'low'
    })
  });

  assert.deepEqual(plan, {
    local_mode: 'skipped',
    requested_profiles: []
  });
});

test('planHybridLocalReview falls back to full local review when GPT is unavailable', () => {
  const heuristics = analyzeHybridHeuristics({
    changedFiles: ['src/utils.ts'],
    diffText: '@@\n+export const value = 1;\n'
  });

  const plan = planHybridLocalReview({
    heuristics,
    gptReview: hybridGptReview({
      confidence: null,
      error: 'quota exhausted',
      focus_profiles: [],
      needs_local_deep_review: true,
      overall_risk: null,
      status: 'unavailable',
      summary: null
    })
  });

  assert.deepEqual(plan, {
    local_mode: 'full',
    requested_profiles: ['typescript']
  });
});

test('createHybridGptBypassReview marks oversized diffs for local fallback', () => {
  const review = createHybridGptBypassReview(
    `Diff exceeded ${MAX_HYBRID_GPT_DIFF_CHARS} chars.`
  );

  assert.equal(review.status, 'runtime-error');
  assert.equal(review.needs_local_deep_review, true);
  assert.match(review.error ?? '', /Diff exceeded/);
});

test('planHybridLocalReview forces full local review for sensitive changes before GPT focus narrowing', () => {
  const heuristics = analyzeHybridHeuristics({
    changedFiles: ['src/auth.service.ts'],
    diffText: '@@\n+const token = process.env.API_KEY;\n'
  });

  const plan = planHybridLocalReview({
    heuristics,
    gptReview: hybridGptReview({
      confidence: 'high',
      focus_profiles: ['general'],
      needs_local_deep_review: false,
      overall_risk: 'low'
    })
  });

  assert.deepEqual(plan, {
    local_mode: 'full',
    requested_profiles: ['angular']
  });
});

test('planHybridLocalReview narrows the local run to GPT focus profiles when confidence is low', () => {
  const heuristics = analyzeHybridHeuristics({
    changedFiles: ['README.md', 'src/utils.ts'],
    diffText: '@@\n+docs and code\n'
  });

  const plan = planHybridLocalReview({
    heuristics,
    gptReview: hybridGptReview({
      confidence: 'low',
      focus_profiles: ['repo-habits'],
      needs_local_deep_review: true,
      overall_risk: 'medium'
    })
  });

  assert.deepEqual(plan, {
    local_mode: 'targeted',
    requested_profiles: ['repo-habits']
  });
});

test('buildHybridReviewReport escalates when either GPT or local review blocks and deduplicates merged findings', () => {
  const heuristics = analyzeHybridHeuristics({
    changedFiles: ['src/auth.service.ts'],
    diffText: '@@\n+execSync("whoami")\n'
  });
  const report = buildHybridReviewReport({
    heuristics,
    gptReview: hybridGptReview({
      confidence: 'medium',
      findings: [
        {
          severity: 'high',
          title: 'Shell execution',
          detail: 'Uses execSync.',
          file_path: 'src/auth.service.ts',
          line: 3,
          recommendation: 'Avoid shell execution.'
        }
      ],
      focus_profiles: ['angular'],
      needs_local_deep_review: true,
      overall_risk: 'high'
    }),
    localReviewResult: {
      local_mode: 'full',
      requested_profiles: ['angular'],
      report: reviewReport([
        {
          severity: 'high',
          title: 'Shell execution',
          detail: 'Uses execSync.',
          file_path: 'src/auth.service.ts',
          line: 3,
          recommendation: 'Avoid shell execution.',
          profile: 'typescript',
          rationale: null,
          evidence: null
        }
      ]),
      error: null
    }
  });

  assert.equal(report.recommended_escalation, true);
  assert.match(
    report.escalation_reasons.join(' '),
    /GPT reviewer marked the change high risk/
  );
  assert.match(report.escalation_reasons.join(' '), /sensitive area detected/);
  assert.equal(report.merged_findings.length, 1);
  assert.equal(report.findings.length, 1);
  assert.equal(report.merged_findings[0]?.source, 'gpt');
  assert.match(report.summary, /Low-risk change|Hybrid review completed/i);
  assert.equal(report.decision_basis, 'gpt+local');
  assert.match(
    buildHybridPrefilterContext({ report }),
    /gpt_provider=copilot-gpt-5-mini/
  );
});

test('createHybridGptTelemetryContext keeps hybrid GPT observations separate from checkpoint review buckets', () => {
  const checkpointBucket = createProviderObservationBucketKey({
    ...createProviderTelemetryContext({
      callsite: 'checkpoint-review',
      checkpoint: 'implementation'
    }),
    model: 'gpt-5-mini',
    operation: 'review',
    provider: 'copilot'
  });
  const hybridBucket = createProviderObservationBucketKey({
    ...createHybridGptTelemetryContext(),
    model: 'gpt-5-mini',
    operation: 'review',
    provider: 'copilot'
  });

  assert.notEqual(checkpointBucket, hybridBucket);
  assert.match(checkpointBucket, /checkpoint-review/);
  assert.match(checkpointBucket, /\bimplementation\b/);
  assert.doesNotMatch(checkpointBucket, /hybrid-gpt-review/);
  assert.match(hybridBucket, /hybrid-gpt-review/);
  assert.match(hybridBucket, /:none:/);
  assert.doesNotMatch(hybridBucket, /checkpoint-review/);
  assert.doesNotMatch(hybridBucket, /\bimplementation\b/);
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

test('selectAbSamples prefers typed coverage before filling the remainder', () => {
  const results = selectAbSamples([
    sample('small-ts', 'a'),
    sample('multi-file-refactor', 'b'),
    sample('workspace-config', 'c'),
    sample('higher-risk', 'd'),
    sample('general', 'e')
  ]);

  assert.deepEqual(
    results.map((entry) => entry.kind),
    ['small-ts', 'multi-file-refactor', 'workspace-config', 'higher-risk']
  );
});

test('selectEvaluationSamples backfills with remaining kinds when a soft quota is missing', () => {
  const selected = selectEvaluationSamples({
    candidates: [
      sample('small-ts', 'a'),
      sample('small-ts', 'b'),
      sample('general', 'c'),
      sample('general', 'd'),
      sample('multi-file-refactor', 'e')
    ],
    rounds: 4,
    seed: 1
  });

  assert.equal(selected.length, 4);
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
          report
        }).length
      }
    ];

    const output = summarizeEvaluation({
      config: {
        abSampleCount: 0,
        jobs: 2,
        repoNames: ['gx.law-prep'],
        rounds: 1,
        seed: 1,
        smallDiffThresholdChars: DEFAULT_SMALL_DIFF_THRESHOLD_CHARS
      },
      localResults,
      reviewerResults: [],
      repoRoot: workspace
    });

    assert.match(output.summaryMarkdown, /usable-prefilter/);
    assert.match(output.summaryMarkdown, /Local parallel jobs: 2/);
    assert.match(
      output.summaryMarkdown,
      /Estimated paid review context chars: 0\/20/
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
  commit: string
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
    totalChangedLines: 10
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
          patch: '@@\n+const value = 1;\n'
        }
      ]
    },
    profiles: [{ name: 'typescript', description: 'TypeScript' }],
    findings,
    trace: ['Intake', 'Route', 'Synthesis'],
    summary: 'Reviewed 1 file(s).',
    model_used: 'qwen3:8b',
    runtime_provider: 'ollama',
    advisory_only: true
  };
}

function hybridGptReview(overrides: Partial<HybridGptReview>): HybridGptReview {
  return {
    provider: 'copilot-gpt-5-mini',
    model: 'gpt-5-mini',
    status: 'completed',
    overall_risk: 'low',
    confidence: 'high',
    needs_local_deep_review: false,
    focus_profiles: [],
    findings: [],
    summary: 'Low-risk change.',
    error: null,
    ...overrides
  };
}
