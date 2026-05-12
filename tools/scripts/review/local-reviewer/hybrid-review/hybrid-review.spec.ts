import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createProviderObservationBucketKey,
  createProviderTelemetryContext,
} from '../../provider-observability/provider-observability.ts';
import {
  analyzeHybridHeuristics,
  buildHybridReviewReport,
  createHybridGptBypassReview,
  createHybridGptTelemetryContext,
  planHybridLocalReview,
} from './hybrid-review.ts';
import { buildHybridPrefilterContext } from '../prefilter/prefilter.ts';
import {
  MAX_HYBRID_GPT_DIFF_CHARS,
  type HybridGptReview,
  type LocalReviewFinding,
  type LocalReviewReport,
} from '../shared/shared.ts';

test('planHybridLocalReview skips local execution for a confident low-risk GPT review', () => {
  const heuristics = analyzeHybridHeuristics({
    changedFiles: ['src/utils.ts'],
    diffText: '@@\n+export const value = 1;\n',
  });

  const plan = planHybridLocalReview({
    heuristics,
    gptReview: hybridGptReview({
      confidence: 'high',
      focus_profiles: ['typescript'],
      needs_local_deep_review: false,
      overall_risk: 'low',
    }),
  });

  assert.deepEqual(plan, {
    local_mode: 'skipped',
    requested_profiles: [],
  });
});

test('planHybridLocalReview falls back to full local review when GPT is unavailable', () => {
  const heuristics = analyzeHybridHeuristics({
    changedFiles: ['src/utils.ts'],
    diffText: '@@\n+export const value = 1;\n',
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
      summary: null,
    }),
  });

  assert.deepEqual(plan, {
    local_mode: 'full',
    requested_profiles: ['typescript'],
  });
});

test('createHybridGptBypassReview marks oversized diffs for local fallback', () => {
  const review = createHybridGptBypassReview(
    `Diff exceeded ${MAX_HYBRID_GPT_DIFF_CHARS} chars.`,
  );

  assert.equal(review.status, 'runtime-error');
  assert.equal(review.needs_local_deep_review, true);
  assert.match(review.error ?? '', /Diff exceeded/);
});

test('planHybridLocalReview forces full local review for sensitive changes before GPT focus narrowing', () => {
  const heuristics = analyzeHybridHeuristics({
    changedFiles: ['src/auth.service.ts'],
    diffText: '@@\n+const token = process.env.API_KEY;\n',
  });

  const plan = planHybridLocalReview({
    heuristics,
    gptReview: hybridGptReview({
      confidence: 'high',
      focus_profiles: ['general'],
      needs_local_deep_review: false,
      overall_risk: 'low',
    }),
  });

  assert.deepEqual(plan, {
    local_mode: 'full',
    requested_profiles: ['angular'],
  });
});

test('planHybridLocalReview narrows the local run to GPT focus profiles when confidence is low', () => {
  const heuristics = analyzeHybridHeuristics({
    changedFiles: ['README.md', 'src/utils.ts'],
    diffText: '@@\n+docs and code\n',
  });

  const plan = planHybridLocalReview({
    heuristics,
    gptReview: hybridGptReview({
      confidence: 'low',
      focus_profiles: ['repo-habits'],
      needs_local_deep_review: true,
      overall_risk: 'medium',
    }),
  });

  assert.deepEqual(plan, {
    local_mode: 'targeted',
    requested_profiles: ['repo-habits'],
  });
});

test('buildHybridReviewReport escalates when either GPT or local review blocks and deduplicates merged findings', () => {
  const heuristics = analyzeHybridHeuristics({
    changedFiles: ['src/auth.service.ts'],
    diffText: '@@\n+execSync("whoami")\n',
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
          recommendation: 'Avoid shell execution.',
        },
      ],
      focus_profiles: ['angular'],
      needs_local_deep_review: true,
      overall_risk: 'high',
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
          evidence: null,
        },
      ]),
      error: null,
    },
  });

  assert.equal(report.recommended_escalation, true);
  assert.match(
    report.escalation_reasons.join(' '),
    /GPT reviewer marked the change high risk/,
  );
  assert.match(report.escalation_reasons.join(' '), /sensitive area detected/);
  assert.equal(report.merged_findings.length, 1);
  assert.equal(report.findings.length, 1);
  assert.equal(report.merged_findings[0]?.source, 'gpt');
  assert.match(report.summary, /Low-risk change|Hybrid review completed/i);
  assert.equal(report.decision_basis, 'gpt+local');
  assert.match(buildHybridPrefilterContext({ report }), /gpt_provider=codex/);
});

test('createHybridGptTelemetryContext keeps hybrid GPT observations separate from checkpoint review buckets', () => {
  const checkpointBucket = createProviderObservationBucketKey({
    ...createProviderTelemetryContext({
      callsite: 'checkpoint-review',
      checkpoint: 'implementation',
    }),
    model: 'gpt-5-mini',
    operation: 'review',
    provider: 'copilot',
  });
  const hybridBucket = createProviderObservationBucketKey({
    ...createHybridGptTelemetryContext(),
    model: 'gpt-5-mini',
    operation: 'review',
    provider: 'copilot',
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

function hybridGptReview(overrides: Partial<HybridGptReview>): HybridGptReview {
  return {
    provider: 'codex',
    model: null,
    status: 'completed',
    overall_risk: 'low',
    confidence: 'high',
    needs_local_deep_review: false,
    focus_profiles: [],
    findings: [],
    summary: 'Low-risk change.',
    error: null,
    ...overrides,
  };
}
