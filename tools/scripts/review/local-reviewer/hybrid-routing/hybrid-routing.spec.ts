import { describe, expect, it } from 'vitest';
import {
  analyzeHybridHeuristics,
  createHybridGptBypassReview,
  planHybridLocalReview
} from './hybrid-routing.ts';
import type { HybridGptReview, HybridHeuristics } from '../shared/shared.ts';

function makeHeuristics(
  partial: Partial<HybridHeuristics> = {}
): HybridHeuristics {
  return {
    changed_files: [],
    diff_length: 0,
    file_count: 0,
    routed_profiles: ['general'],
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
    summary: 'looks good',
    error: null,
    ...partial
  };
}

describe('analyzeHybridHeuristics', () => {
  it('routes Angular component paths to the angular profile', () => {
    const result = analyzeHybridHeuristics({
      changedFiles: ['apps/ng-frontend/src/app/foo.component.ts'],
      diffText: 'noop'
    });
    expect(result.routed_profiles).toContain('angular');
    expect(result.file_count).toBe(1);
    expect(result.diff_length).toBe('noop'.length);
  });

  it('routes Nest controller paths to the nest profile', () => {
    const result = analyzeHybridHeuristics({
      changedFiles: ['apps/nest-backend/src/foo.controller.ts'],
      diffText: ''
    });
    expect(result.routed_profiles).toContain('nest');
  });

  it('falls back to general when no specific patterns match', () => {
    const result = analyzeHybridHeuristics({
      changedFiles: ['random/path/file.unknown'],
      diffText: ''
    });
    expect(result.routed_profiles).toEqual(['general']);
  });

  it('normalizes backslashes in changed file paths', () => {
    const result = analyzeHybridHeuristics({
      changedFiles: ['apps\\ng-frontend\\src\\foo.component.ts'],
      diffText: ''
    });
    expect(result.changed_files[0]).toBe(
      'apps/ng-frontend/src/foo.component.ts'
    );
  });

  it('detects sensitive categories from diff text', () => {
    const result = analyzeHybridHeuristics({
      changedFiles: ['src/foo.ts'],
      diffText: 'jwt token logic'
    });
    expect(result.sensitive_categories).toContain('auth');
    expect(result.sensitive_categories).toContain('secrets');
  });
});

describe('createHybridGptBypassReview', () => {
  it('creates a runtime-error review with the supplied reason', () => {
    const review = createHybridGptBypassReview('skipped: cli unavailable');
    expect(review.status).toBe('runtime-error');
    expect(review.needs_local_deep_review).toBe(true);
    expect(review.error).toBe('skipped: cli unavailable');
    expect(review.findings).toEqual([]);
    expect(review.summary).toBeNull();
  });
});

describe('planHybridLocalReview', () => {
  it('forces full local review when sensitive categories are present', () => {
    const plan = planHybridLocalReview({
      gptReview: makeGptReview(),
      heuristics: makeHeuristics({
        sensitive_categories: ['auth'],
        routed_profiles: ['nest', 'general']
      })
    });
    expect(plan.local_mode).toBe('full');
    expect(plan.requested_profiles).toEqual(['nest', 'general']);
  });

  it('forces full local review when file_count > 15', () => {
    const plan = planHybridLocalReview({
      gptReview: makeGptReview(),
      heuristics: makeHeuristics({
        file_count: 20,
        routed_profiles: ['typescript']
      })
    });
    expect(plan.local_mode).toBe('full');
  });

  it('forces full local review when GPT review did not complete', () => {
    const plan = planHybridLocalReview({
      gptReview: makeGptReview({ status: 'unavailable' }),
      heuristics: makeHeuristics({ routed_profiles: ['typescript'] })
    });
    expect(plan.local_mode).toBe('full');
    expect(plan.requested_profiles).toEqual(['typescript']);
  });

  it('skips local review when GPT review is high-confidence and complete', () => {
    const plan = planHybridLocalReview({
      gptReview: makeGptReview({
        confidence: 'high',
        needs_local_deep_review: false
      }),
      heuristics: makeHeuristics({ routed_profiles: ['typescript'] })
    });
    expect(plan.local_mode).toBe('skipped');
    expect(plan.requested_profiles).toEqual([]);
  });

  it('runs targeted local review when GPT confidence is low and only some profiles intersect', () => {
    const plan = planHybridLocalReview({
      gptReview: makeGptReview({
        confidence: 'low',
        focus_profiles: ['nest']
      }),
      heuristics: makeHeuristics({ routed_profiles: ['nest', 'angular'] })
    });
    expect(plan.local_mode).toBe('targeted');
    expect(plan.requested_profiles).toEqual(['nest']);
  });

  it('runs full local review when GPT requests local deep review and all routed profiles are needed', () => {
    const plan = planHybridLocalReview({
      gptReview: makeGptReview({
        needs_local_deep_review: true,
        focus_profiles: ['nest', 'angular']
      }),
      heuristics: makeHeuristics({ routed_profiles: ['nest', 'angular'] })
    });
    expect(plan.local_mode).toBe('full');
  });
});
