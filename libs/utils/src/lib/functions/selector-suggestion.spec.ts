import { describe, expect, it } from 'vitest';
import type { ElementCandidate } from '../types/tag-check/step-failure.type';
import {
  candidateScore,
  rankCandidates,
  recordedHints,
  validateSelectorTrial
} from './selector-suggestion';

function candidate(
  index: number,
  name: string,
  attributes: Record<string, string> = {},
  tag = 'button',
  selectors = [`#c${index}`]
): ElementCandidate {
  return {
    index,
    tag,
    role: tag === 'a' ? 'link' : 'button',
    name,
    attributes,
    box: { x: 0, y: 0, width: 10, height: 10 },
    selectors
  };
}

describe('recordedHints', () => {
  it("reads the names, hooks, ids and tag in Chrome Recorder's selectors", () => {
    expect(
      recordedHints([
        'aria/Add to cart[role="button"]',
        'text/Add to cart',
        '[data-testid="add-to-cart"]',
        'pierce/#add-btn',
        'xpath//main/form/button[2]'
      ])
    ).toEqual({
      names: ['Add to cart'],
      testIds: ['add-to-cart'],
      ids: ['add-btn'],
      tag: 'button'
    });
  });

  it('takes the tag from the last part of a CSS selector', () => {
    expect(recordedHints(['main > form a.primary']).tag).toBe('a');
    expect(recordedHints(["[data-testid='x']"])).toMatchObject({
      testIds: ['x'],
      tag: null
    });
  });
});

describe('candidateScore', () => {
  const hints = recordedHints([
    'aria/Add to cart',
    '[data-testid="add-to-cart"]'
  ]);

  it('scores a renamed button above an unrelated one', () => {
    const renamed = candidate(1, 'Add to bag', {
      'data-testid': 'product-add-to-bag'
    });
    const other = candidate(2, 'Sign in', { 'data-testid': 'sign-in' });

    expect(candidateScore(renamed, hints)).toBeGreaterThan(
      candidateScore(other, hints)
    );
  });

  it('scores the same name highest', () => {
    expect(candidateScore(candidate(1, 'Add to cart'), hints)).toBeGreaterThan(
      candidateScore(candidate(2, 'Add to bag'), hints)
    );
  });
});

describe('rankCandidates', () => {
  it('puts the likeliest first, keeps page order on ties and drops elements without selectors', () => {
    const context = {
      selectors: [{ selector: 'aria/Add to cart', matches: 0 }],
      candidates: [
        candidate(0, 'Home'),
        candidate(1, 'Cart', {}, 'a'),
        candidate(2, 'Add to bag'),
        candidate(3, 'Add to cart', {}, 'button', []),
        candidate(4, 'About')
      ]
    };

    expect(rankCandidates(context, 3).map((c) => c.index)).toEqual([2, 1, 0]);
    expect(rankCandidates(context, 0)).toEqual([]);
  });
});

describe('validateSelectorTrial', () => {
  it('keeps the step and its selectors, trimmed and without repeats', () => {
    expect(
      validateSelectorTrial({
        stepIndex: 4,
        selectors: [' [data-testid="add"] ', 'aria/Add', '[data-testid="add"]']
      })
    ).toEqual({
      ok: true,
      request: { stepIndex: 4, selectors: ['[data-testid="add"]', 'aria/Add'] }
    });
  });

  it.each([
    [null, 'The body must be an object'],
    [{ stepIndex: -1, selectors: ['#a'] }, 'stepIndex'],
    [{ stepIndex: 1.5, selectors: ['#a'] }, 'stepIndex'],
    [{ stepIndex: 0, selectors: [] }, 'selectors'],
    [{ stepIndex: 0, selectors: ['#a', ' '] }, 'selectors'],
    [{ stepIndex: 0, selectors: ['#a', 2] }, 'selectors'],
    [{ stepIndex: 0, selectors: Array(6).fill('#a') }, 'selectors'],
    [{ stepIndex: 0, selectors: ['x'.repeat(501)] }, 'selectors']
  ])('rejects %j', (body, error) => {
    const result = validateSelectorTrial(body);
    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.error).toContain(error);
  });
});
