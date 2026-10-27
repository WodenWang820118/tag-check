import { describe, expect, it } from 'vitest';
import type { Recording } from '@utils';
import { selectorChanges, withStepSelectors } from './selector-heal';

const recording: Recording = {
  title: 'Add to cart',
  steps: [
    { type: 'navigate', url: 'https://shop.example/' },
    {
      type: 'click',
      offsetX: 4,
      selectors: [
        ['aria/Add to cart'],
        ['#shadow-host', '#add'],
        ['[data-testid="add-to-bag"]']
      ]
    }
  ]
};

describe('selectorChanges', () => {
  it('adds the new selectors, then removes the old ones', () => {
    expect(
      selectorChanges(
        ['aria/Add to cart', '[data-testid="add-to-bag"]'],
        ['[data-testid="add-to-bag"]', 'aria/Add to bag'],
        false
      )
    ).toEqual([
      { change: 'add', selector: '[data-testid="add-to-bag"]' },
      { change: 'add', selector: 'aria/Add to bag' },
      { change: 'remove', selector: 'aria/Add to cart' }
    ]);
  });

  it('keeps the old ones after the new ones when asked', () => {
    expect(selectorChanges(['#old'], ['#new'], true)).toEqual([
      { change: 'add', selector: '#new' },
      { change: 'keep', selector: '#old' }
    ]);
  });
});

describe('withStepSelectors', () => {
  it("replaces only the step's selectors, leaving the recording as it was", () => {
    const changed = withStepSelectors(recording, 1, ['#new'], false);

    expect(changed.steps[1]).toEqual({
      type: 'click',
      offsetX: 4,
      selectors: [['#new']]
    });
    expect(changed.steps[0]).toBe(recording.steps[0]);
    expect(recording.steps[1].selectors).toHaveLength(3);
  });

  it('keeps the old groups, piercing chains included, after the new ones', () => {
    const changed = withStepSelectors(
      recording,
      1,
      ['[data-testid="add-to-bag"]'],
      true
    );

    expect(changed.steps[1].selectors).toEqual([
      ['[data-testid="add-to-bag"]'],
      ['aria/Add to cart'],
      ['#shadow-host', '#add']
    ]);
  });

  it('refuses a step the recording does not have', () => {
    expect(() => withStepSelectors(recording, 5, ['#new'], false)).toThrow(
      'The recording has no step 6'
    );
  });
});
