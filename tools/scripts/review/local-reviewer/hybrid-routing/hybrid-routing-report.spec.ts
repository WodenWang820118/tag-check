import { describe, expect, it } from 'vitest';
import { buildHybridReviewReport } from './hybrid-routing.ts';
import type {
  HybridGptReview,
  HybridHeuristics,
  HybridLocalReviewResult,
  LocalReviewFinding,
  LocalReviewReport
} from '../shared/shared.ts';

function makeHeuristics(
  partial: Partial<HybridHeuristics> = {}
): HybridHeuristics {
  return {
    changed_files: ['apps/foo.ts'],
    diff_length: 100,
    file_count: 1,
    routed_profiles: ['typescript'],
    sensitive_categories: [],
    ...partial
  };
}

function makeGptReview(
  partial: Partial<HybridGptReview> = {}
): HybridGptReview {
  return {
    provider: 'copilot-gpt-5-mini',
    model: 'gpt-5-mini',
    status: 'completed',
    overall_risk: 'low',
    confidence: 'high',
    needs_local_deep_review: false,
    focus_profiles: [],
    findings: [],
    summary: 'gpt summary',
    error: null,
    ...partial
  };
}

function makeLocalFinding(
  partial: Partial<LocalReviewFinding> = {}
): LocalReviewFinding {
  return {
    severity: 'medium',
    title: 'local title',
    detail: 'local detail',
    file_path: 'apps/foo.ts',
    line: 10,
    recommendation: null,
    profile: 'typescript',
    rationale: null,
    evidence: null,
    ...partial
  };
}

function makeLocalReport(
  findings: LocalReviewFinding[],
  partial: Partial<LocalReviewReport> = {}
): LocalReviewReport {
  return {
    generated_at: '2025-01-01T00:00:00Z',
    context: {
      repo_root: '/repo',
      base_ref: null,
      head_ref: null,
      staged: false,
      requested_profiles: ['typescript'],
      config_source: null,
      files: []
    },
    profiles: [],
    findings,
    trace: [],
    summary: 'local summary',
    model_used: null,
    runtime_provider: 'ollama',
    advisory_only: true,
    ...partial
  };
}

describe('buildHybridReviewReport', () => {
  it('returns a gpt-only report when no local review result is provided', () => {
    const report = buildHybridReviewReport({
      gptReview: makeGptReview(),
      heuristics: makeHeuristics()
    });
    expect(report.strategy).toBe('gpt-gate');
    expect(report.local_mode).toBe('skipped');
    expect(report.requested_profiles).toEqual([]);
    expect(report.local_review).toBeNull();
    expect(report.local_review_error).toBeNull();
    expect(report.decision_basis).toBe('gpt');
    expect(report.recommended_escalation).toBe(false);
    expect(report.escalation_reasons).toEqual([]);
    expect(report.summary).toBe('gpt summary');
    expect(report.findings).toEqual([]);
  });

  it('falls back to a generated summary when neither gpt nor local provide one', () => {
    const report = buildHybridReviewReport({
      gptReview: makeGptReview({ summary: null }),
      heuristics: makeHeuristics({ file_count: 3 })
    });
    expect(report.summary).toBe('Hybrid review completed for 3 file(s).');
  });

  it('escalates when GPT marks risk high', () => {
    const report = buildHybridReviewReport({
      gptReview: makeGptReview({ overall_risk: 'high' }),
      heuristics: makeHeuristics()
    });
    expect(report.recommended_escalation).toBe(true);
    expect(report.escalation_reasons).toContain(
      'GPT reviewer marked the change high risk'
    );
  });

  it('escalates and lists sensitive categories when heuristics flag them', () => {
    const report = buildHybridReviewReport({
      gptReview: makeGptReview(),
      heuristics: makeHeuristics({ sensitive_categories: ['auth', 'secrets'] })
    });
    expect(report.recommended_escalation).toBe(true);
    expect(
      report.escalation_reasons.some((reason) =>
        reason.startsWith('sensitive area detected: ')
      )
    ).toBe(true);
  });

  it('reports gpt+local decision basis when local review ran', () => {
    const localResult: HybridLocalReviewResult = {
      local_mode: 'targeted',
      requested_profiles: ['typescript'],
      report: makeLocalReport([makeLocalFinding()]),
      error: null
    };
    const report = buildHybridReviewReport({
      gptReview: makeGptReview(),
      heuristics: makeHeuristics(),
      localReviewResult: localResult
    });
    expect(report.decision_basis).toBe('gpt+local');
    expect(report.local_mode).toBe('targeted');
    expect(report.requested_profiles).toEqual(['typescript']);
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0].source).toBe('local');
  });

  it('falls back to local-fallback decision basis when local review errored', () => {
    const localResult: HybridLocalReviewResult = {
      local_mode: 'full',
      requested_profiles: ['typescript'],
      report: null,
      error: 'local crashed'
    };
    const report = buildHybridReviewReport({
      gptReview: makeGptReview(),
      heuristics: makeHeuristics(),
      localReviewResult: localResult
    });
    expect(report.decision_basis).toBe('local-fallback');
    expect(report.local_review_error).toBe('local crashed');
    expect(report.escalation_reasons).toContain(
      'local runtime failure: local crashed'
    );
  });

  it('escalates when a local critical/high finding is reported', () => {
    const localResult: HybridLocalReviewResult = {
      local_mode: 'full',
      requested_profiles: ['typescript'],
      report: makeLocalReport([
        makeLocalFinding({ severity: 'critical', title: 'boom' })
      ]),
      error: null
    };
    const report = buildHybridReviewReport({
      gptReview: makeGptReview(),
      heuristics: makeHeuristics(),
      localReviewResult: localResult
    });
    expect(report.escalation_reasons).toContain(
      'local reviewer reported a critical/high finding'
    );
  });

  it('sorts merged findings by severity then file then line', () => {
    const gptReview = makeGptReview({
      findings: [
        {
          severity: 'low',
          title: 'gpt-low',
          detail: 'd',
          file_path: 'a.ts',
          line: 1,
          recommendation: null
        }
      ]
    });
    const localResult: HybridLocalReviewResult = {
      local_mode: 'full',
      requested_profiles: ['typescript'],
      report: makeLocalReport([
        makeLocalFinding({
          severity: 'critical',
          title: 'crit-1',
          file_path: 'b.ts',
          line: 5
        }),
        makeLocalFinding({
          severity: 'high',
          title: 'high-1',
          file_path: 'a.ts',
          line: 2
        })
      ]),
      error: null
    };
    const report = buildHybridReviewReport({
      gptReview,
      heuristics: makeHeuristics(),
      localReviewResult: localResult
    });
    expect(report.findings.map((finding) => finding.severity)).toEqual([
      'critical',
      'high',
      'low'
    ]);
  });

  it('falls back to local-fallback when gpt review status is not completed', () => {
    const localResult: HybridLocalReviewResult = {
      local_mode: 'full',
      requested_profiles: ['typescript'],
      report: makeLocalReport([]),
      error: null
    };
    const report = buildHybridReviewReport({
      gptReview: makeGptReview({ status: 'unavailable', summary: null }),
      heuristics: makeHeuristics(),
      localReviewResult: localResult
    });
    expect(report.decision_basis).toBe('local-fallback');
  });
});
