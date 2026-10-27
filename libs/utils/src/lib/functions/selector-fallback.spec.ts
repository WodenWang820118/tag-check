import { describe, expect, it } from 'vitest';
import type { ElementCandidate } from '../types/tag-check/step-failure.type';
import { chooseFallbackCandidate } from './selector-fallback';

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

function choose(selectors: string[], candidates: ElementCandidate[]) {
  return chooseFallbackCandidate({
    selectors: selectors.map((selector) => ({ selector, matches: 0 })),
    candidates
  });
}

describe('chooseFallbackCandidate', () => {
  it('matches a data-testid exactly', () => {
    const button = candidate(0, 'Buy now', {
      'data-testid': 'add-to-cart'
    });

    expect(
      choose(['main > div.old > [data-testid="add-to-cart"]'], [button])
    ).toEqual({
      candidate: button,
      matchedBy: 'testId',
      value: 'add-to-cart'
    });
    expect(
      choose(
        ['[data-testid="add-to-cart"]'],
        [candidate(0, 'Add', { 'data-testid': 'add-to-bag' })]
      )
    ).toBeNull();
  });

  it('matches an id exactly, and prefers it to a name', () => {
    const byId = candidate(0, 'Save', { id: 'save-later' });
    const byName = candidate(1, 'Save for later');

    expect(
      choose(['aria/Save for later', '#save-later'], [byName, byId])
    ).toEqual({
      candidate: byId,
      matchedBy: 'id',
      value: 'save-later'
    });
    expect(
      choose(['#add'], [candidate(0, 'Add', { id: 'add-to-cart' })])
    ).toBeNull();
  });

  it('matches a name after trimming, collapsing whitespace and lower-casing', () => {
    const button = candidate(0, '  ADD\tto   cart ');

    expect(choose(['text/Add  to   cart'], [button])).toEqual({
      candidate: button,
      matchedBy: 'name',
      value: 'Add  to   cart'
    });
  });

  it('prefers a test hook over a name', () => {
    const byHook = candidate(0, 'Buy now', { 'data-testid': 'add-to-cart' });
    const byName = candidate(1, 'Add to cart');

    expect(
      choose(
        ['aria/Add to cart', '[data-testid="add-to-cart"]'],
        [byName, byHook]
      )
    ).toEqual({
      candidate: byHook,
      matchedBy: 'testId',
      value: 'add-to-cart'
    });
  });

  it('returns null when the deciding rule matches two candidates', () => {
    expect(
      choose(
        ['[data-testid="add-to-cart"]', 'aria/Add to cart'],
        [
          candidate(0, 'Other', { 'data-testid': 'add-to-cart' }),
          candidate(1, 'Also', { 'data-testid': 'add-to-cart' }),
          candidate(2, 'Add to cart')
        ]
      )
    ).toBeNull();
  });

  it('returns null when the chosen candidate has another tag', () => {
    const link = candidate(
      0,
      'Add to cart',
      { 'data-testid': 'add-to-cart' },
      'a'
    );

    expect(choose(['button[data-testid="add-to-cart"]'], [link])).toBeNull();
    expect(
      choose(
        ['button[data-testid="add-to-cart"]'],
        [candidate(0, 'Add', { 'data-testid': 'add-to-cart' }, 'button')]
      )?.matchedBy
    ).toBe('testId');
  });

  it('ignores a candidate that has no selector', () => {
    const usable = candidate(1, 'Add', { 'data-testid': 'add-to-cart' });

    expect(
      choose(
        ['[data-testid="add-to-cart"]'],
        [
          candidate(0, 'Add', { 'data-testid': 'add-to-cart' }, 'button', []),
          usable
        ]
      )?.candidate
    ).toBe(usable);
    expect(
      choose(
        ['[data-testid="add-to-cart"]'],
        [candidate(0, 'Add', { 'data-testid': 'add-to-cart' }, 'button', [])]
      )
    ).toBeNull();
  });

  it('returns null when nothing was recorded to match on', () => {
    const present = candidate(0, 'Add to cart', {
      id: 'add',
      'data-testid': 'add-to-cart'
    });

    expect(choose(['div.old > span'], [present])).toBeNull();
    expect(choose([], [present])).toBeNull();
  });
});
