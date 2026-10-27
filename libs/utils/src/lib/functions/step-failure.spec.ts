import { describe, expect, it } from 'vitest';
import { describeStepFailure } from './step-failure';

describe('describeStepFailure', () => {
  it('names the step, from 1, and the wait', () => {
    expect(
      describeStepFailure({
        stepIndex: 3,
        stepType: 'click',
        selectorCount: 3,
        timeoutMs: 15000
      })
    ).toBe(
      'Step 4 (click) could not find its element: none of its 3 selectors appeared within 15 s.'
    );
  });

  it('reads well for one selector, an unknown type and a fractional wait', () => {
    expect(
      describeStepFailure({
        stepIndex: 0,
        stepType: null,
        selectorCount: 1,
        timeoutMs: 2500
      })
    ).toBe(
      'Step 1 could not find its element: its selector did not appear within 2.5 s.'
    );
  });
});
