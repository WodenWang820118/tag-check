import { describe, expect, it } from 'vitest';
import { describeStepFailure, describeStepFallback } from './step-failure';

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

describe('describeStepFallback', () => {
  it('names the test hook the candidate matched', () => {
    expect(
      describeStepFallback({
        stepIndex: 4,
        stepType: 'click',
        selector: '[data-testid="add-to-cart"]',
        matchedBy: 'testId',
        value: 'add-to-cart'
      })
    ).toBe(
      'Step 5 (click) used a fallback selector [data-testid="add-to-cart"]: its recorded selectors found nothing, and one element matched the recorded test hook "add-to-cart".'
    );
  });

  it('names an id', () => {
    expect(
      describeStepFallback({
        stepIndex: 0,
        stepType: 'hover',
        selector: '#save',
        matchedBy: 'id',
        value: 'save'
      })
    ).toBe(
      'Step 1 (hover) used a fallback selector #save: its recorded selectors found nothing, and one element matched the recorded id "save".'
    );
  });

  it('names an accessible name', () => {
    expect(
      describeStepFallback({
        stepIndex: 1,
        stepType: 'change',
        selector: '[aria-label="Search"]',
        matchedBy: 'name',
        value: 'Search'
      })
    ).toBe(
      'Step 2 (change) used a fallback selector [aria-label="Search"]: its recorded selectors found nothing, and one element matched the recorded name "Search".'
    );
  });
});
