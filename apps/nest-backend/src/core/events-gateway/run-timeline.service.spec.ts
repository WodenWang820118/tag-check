import { describe, expect, it } from 'vitest';
import { RunTimelineService } from './run-timeline.service';

describe('RunTimelineService', () => {
  it('keeps the step times of the open run, by step index', () => {
    const timeline = new RunTimelineService();
    timeline.begin('add_to_cart');

    timeline.markStep('add_to_cart', 0, 1000);
    timeline.markStep('add_to_cart', 2, 5000);

    expect(timeline.steps('add_to_cart')).toEqual([1000, undefined, 5000]);
  });

  it('ignores steps and reads of another test', () => {
    const timeline = new RunTimelineService();
    timeline.begin('add_to_cart');

    timeline.markStep('purchase', 0, 1000);

    expect(timeline.steps('add_to_cart')).toEqual([]);
    expect(timeline.steps('purchase')).toEqual([]);
  });

  it('forgets the run when it ends, and starts over on the next', () => {
    const timeline = new RunTimelineService();
    timeline.begin('add_to_cart');
    timeline.markStep('add_to_cart', 0, 1000);

    timeline.end('purchase');
    expect(timeline.steps('add_to_cart')).toEqual([1000]);

    timeline.end('add_to_cart');
    expect(timeline.steps('add_to_cart')).toEqual([]);
    timeline.markStep('add_to_cart', 0, 2000);
    expect(timeline.steps('add_to_cart')).toEqual([]);

    timeline.begin('add_to_cart');
    expect(timeline.steps('add_to_cart')).toEqual([]);
  });
});
