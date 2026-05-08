import { describe, expect, it } from 'vitest';
import { getNewPreventNavigationEvents } from './utils';

describe('getNewPreventNavigationEvents', () => {
  it('returns the incoming events when current is empty', () => {
    expect(getNewPreventNavigationEvents([], ['a', 'b'])).toEqual(['a', 'b']);
  });

  it('adds new events that are not already present', () => {
    expect(getNewPreventNavigationEvents(['a'], ['b'])).toEqual(['a', 'b']);
  });

  it('toggles off events that are already present', () => {
    expect(getNewPreventNavigationEvents(['a', 'b'], ['a'])).toEqual(['b']);
  });

  it('processes mixed add/remove operations in sequence', () => {
    expect(getNewPreventNavigationEvents(['a', 'b'], ['b', 'c'])).toEqual([
      'a',
      'c'
    ]);
  });

  it('does not mutate the input arrays', () => {
    const current = ['a'];
    const events = ['b'];
    getNewPreventNavigationEvents(current, events);
    expect(current).toEqual(['a']);
    expect(events).toEqual(['b']);
  });
});
