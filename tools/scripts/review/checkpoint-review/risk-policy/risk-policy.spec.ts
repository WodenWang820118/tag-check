import { describe, expect, it } from 'vitest';
import {
  inferAutoReviewRisk,
  parseChangedFilesFromContext
} from './risk-policy.ts';

describe('parseChangedFilesFromContext', () => {
  it('returns an empty list when no Changed files: section exists', () => {
    expect(parseChangedFilesFromContext('hello world')).toEqual([]);
  });

  it('extracts dash-bullet entries under the Changed files heading', () => {
    const context = [
      'Header',
      '',
      'Changed files:',
      '- src/a.ts',
      '- src/b.ts',
      '',
      'Other section'
    ].join('\n');
    expect(parseChangedFilesFromContext(context)).toEqual([
      'src/a.ts',
      'src/b.ts'
    ]);
  });

  it('accepts asterisk bullets and stops at the first non-bullet line', () => {
    const context = [
      'Changed files:',
      '* src/a.ts',
      'not a bullet',
      '* src/b.ts'
    ].join('\n');
    expect(parseChangedFilesFromContext(context)).toEqual(['src/a.ts']);
  });

  it('is case-insensitive on the heading', () => {
    expect(parseChangedFilesFromContext('CHANGED FILES:\n- a.ts')).toEqual([
      'a.ts'
    ]);
  });
});

describe('inferAutoReviewRisk', () => {
  const baseInput = {
    checkpoint: 'implementation' as const,
    context: 'Changed files:\n- README.md',
    focus: 'docs polish',
    repoChangedFiles: ['README.md'],
    repoDiffText:
      'diff --git a/README.md b/README.md\n--- a/README.md\n+++ b/README.md\n@@\n+line',
    repoHasUntrackedFiles: false
  };

  it('returns "low" for a tiny markdown-only change at implementation checkpoint', () => {
    expect(inferAutoReviewRisk(baseInput)).toBe('low');
  });

  it('escalates to "high" when focus contains a high-risk keyword like "auth"', () => {
    expect(inferAutoReviewRisk({ ...baseInput, focus: 'auth refactor' })).toBe(
      'high'
    );
  });

  it('escalates to "high" when context mentions a high-risk pattern like "jwt"', () => {
    expect(
      inferAutoReviewRisk({
        ...baseInput,
        context: `Changed files:\n- README.md\n\nContext: jwt refresh logic`
      })
    ).toBe('high');
  });

  it('escalates to "high" when changed files include a controller path', () => {
    expect(
      inferAutoReviewRisk({
        ...baseInput,
        context: 'Changed files:\n- src/auth/login.controller.ts',
        repoChangedFiles: ['src/auth/login.controller.ts'],
        repoDiffText:
          'diff --git a/src/auth/login.controller.ts b/src/auth/login.controller.ts\n@@'
      })
    ).toBe('high');
  });

  it('escalates to "high" for review control-plane paths (.github/**)', () => {
    expect(
      inferAutoReviewRisk({
        ...baseInput,
        context: 'Changed files:\n- .github/workflows/ci.yml',
        repoChangedFiles: ['.github/workflows/ci.yml'],
        repoDiffText:
          'diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml\n@@'
      })
    ).toBe('high');
  });

  it('returns "medium" when checkpoint is not implementation or pre-merge', () => {
    expect(
      inferAutoReviewRisk({ ...baseInput, checkpoint: 'planning' as never })
    ).toBe('medium');
  });

  it('returns "medium" when there are too many changed files', () => {
    expect(
      inferAutoReviewRisk({
        ...baseInput,
        context: 'Changed files:\n- a.md\n- b.md\n- c.md',
        repoChangedFiles: ['a.md', 'b.md', 'c.md'],
        repoDiffText:
          'diff --git a/a.md b/a.md\n@@\ndiff --git a/b.md b/b.md\n@@\ndiff --git a/c.md b/c.md\n@@'
      })
    ).toBe('medium');
  });

  it('returns "medium" when repo has untracked files', () => {
    expect(
      inferAutoReviewRisk({ ...baseInput, repoHasUntrackedFiles: true })
    ).toBe('medium');
  });

  it('returns "medium" when changed-file lists in context and repo disagree', () => {
    expect(
      inferAutoReviewRisk({
        ...baseInput,
        repoChangedFiles: ['OTHER.md']
      })
    ).toBe('medium');
  });

  it('returns "medium" when the diff text does not mention all repo changed files', () => {
    expect(
      inferAutoReviewRisk({
        ...baseInput,
        repoDiffText: 'noise without header'
      })
    ).toBe('medium');
  });
});
