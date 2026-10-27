import { describe, expect, it } from 'vitest';
import type { Recording } from '@utils';
import {
  chosenSelectors,
  selectorChanges,
  selectorGroupText,
  withoutExcludedSelectors,
  withStepSelectors
} from './selector-heal';

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

describe('chosenSelectors', () => {
  it('keeps the order and drops the ones the user unticked', () => {
    expect(
      chosenSelectors(
        ['[data-testid="add-to-cart"]', 'body > button', 'aria/Add to cart'],
        ['body > button', 'not-in-the-list']
      )
    ).toEqual(['[data-testid="add-to-cart"]', 'aria/Add to cart']);
  });

  it('keeps every selector when none are unticked', () => {
    expect(chosenSelectors(['#a', '#b'], [])).toEqual(['#a', '#b']);
  });
});

describe('withoutExcludedSelectors', () => {
  it('drops an unticked selector the old list would keep', () => {
    const changed = withoutExcludedSelectors(
      withStepSelectors(recording, 1, ['#new'], true),
      1,
      ['aria/Add to cart']
    );

    expect(changed.steps[1].selectors).toEqual([
      ['#new'],
      ['#shadow-host', '#add'],
      ['[data-testid="add-to-bag"]']
    ]);
    expect(recording.steps[1].selectors).toHaveLength(3);
  });
});

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

describe('selectorGroupText', () => {
  it('reads a selector as recorded, and a shadow chain as one line', () => {
    expect(selectorGroupText('#add')).toBe('#add');
    expect(selectorGroupText(['my-widget', 'button.buy'])).toBe(
      'my-widget >>>> button.buy'
    );
  });
});
