import { describe, expect, it } from 'vitest';
import {
  createReviewExecution,
  getReviewExecutionPlan
} from './review-flow.ts';

describe('createReviewExecution', () => {
  it('keeps the explicit model when one is supplied', () => {
    const result = createReviewExecution({
      checkpoint: 'implementation',
      provider: 'copilot',
      focus: 'auth',
      model: 'custom-model'
    });
    expect(result).toEqual({
      checkpoint: 'implementation',
      provider: 'copilot',
      focus: 'auth',
      model: 'custom-model'
    });
  });

  it('defaults the copilot model to DEFAULT_COPILOT_CLAUDE_MODEL', () => {
    const result = createReviewExecution({
      checkpoint: 'plan',
      provider: 'copilot',
      focus: 'plan focus'
    });
    expect(result.model).toBe('claude-sonnet-4.6');
  });

  it('defaults the gemini model based on the checkpoint', () => {
    expect(
      createReviewExecution({
        checkpoint: 'implementation',
        provider: 'gemini',
        focus: 'f'
      }).model
    ).toBe('gemini-3-flash-preview');
    expect(
      createReviewExecution({
        checkpoint: 'pre-merge',
        provider: 'gemini',
        focus: 'f'
      }).model
    ).toBe('gemini-2.5-pro');
  });

  it('leaves the codex model undefined when not supplied', () => {
    const result = createReviewExecution({
      checkpoint: 'plan',
      provider: 'codex',
      focus: 'f'
    });
    expect(result.model).toBeUndefined();
  });
});

describe('getReviewExecutionPlan', () => {
  it('runs a single copilot execution when an explicit copilot model is given', () => {
    const plan = getReviewExecutionPlan({
      checkpoint: 'implementation',
      focus: 'f',
      provider: 'copilot',
      model: 'custom-copilot'
    });
    expect(plan).toHaveLength(1);
    expect(plan[0]?.provider).toBe('copilot');
    expect(plan[0]?.model).toBe('custom-copilot');
  });

  it('runs both copilot defaults when no model is supplied for copilot', () => {
    const plan = getReviewExecutionPlan({
      checkpoint: 'plan',
      focus: 'f',
      provider: 'copilot'
    });
    expect(plan.map((execution) => execution.model)).toEqual([
      'claude-sonnet-4.6',
      'gpt-5-mini'
    ]);
  });

  it('runs a single gemini execution when provider=gemini', () => {
    const plan = getReviewExecutionPlan({
      checkpoint: 'plan',
      focus: 'f',
      provider: 'gemini'
    });
    expect(plan).toHaveLength(1);
    expect(plan[0]?.provider).toBe('gemini');
  });

  it('runs a single codex execution when provider=codex', () => {
    const plan = getReviewExecutionPlan({
      checkpoint: 'plan',
      focus: 'f',
      provider: 'codex'
    });
    expect(plan).toHaveLength(1);
    expect(plan[0]?.provider).toBe('codex');
  });

  it('auto + low-risk implementation prefers codex first then gemini then both copilot models', () => {
    const plan = getReviewExecutionPlan({
      checkpoint: 'implementation',
      focus: 'docs polish',
      provider: 'auto',
      context: 'Changed files:\n- README.md',
      repoChangedFiles: ['README.md'],
      repoDiffText:
        'diff --git a/README.md b/README.md\n--- a/README.md\n+++ b/README.md\n@@\n+x',
      repoHasUntrackedFiles: false
    });
    expect(plan.map((execution) => execution.provider)).toEqual([
      'codex',
      'gemini',
      'copilot',
      'copilot'
    ]);
  });

  it('auto + non-low implementation/pre-merge starts with gemini, both copilots, then codex', () => {
    const plan = getReviewExecutionPlan({
      checkpoint: 'implementation',
      focus: 'auth refactor', // → high risk
      provider: 'auto'
    });
    expect(plan.map((execution) => execution.provider)).toEqual([
      'gemini',
      'copilot',
      'copilot',
      'codex'
    ]);
  });

  it('auto + test checkpoint starts with copilot/claude then gemini then copilot/gpt5 then codex', () => {
    const plan = getReviewExecutionPlan({
      checkpoint: 'test',
      focus: 'f',
      provider: 'auto'
    });
    expect(plan.map((execution) => execution.provider)).toEqual([
      'copilot',
      'gemini',
      'copilot',
      'codex'
    ]);
    expect(plan[0]?.model).toBe('claude-sonnet-4.6');
    expect(plan[2]?.model).toBe('gpt-5-mini');
  });

  it('auto + plan checkpoint runs the default 4-provider rotation', () => {
    const plan = getReviewExecutionPlan({
      checkpoint: 'plan',
      focus: 'f',
      provider: 'auto'
    });
    expect(plan.map((execution) => execution.provider)).toEqual([
      'copilot',
      'gemini',
      'copilot',
      'codex'
    ]);
  });
});
