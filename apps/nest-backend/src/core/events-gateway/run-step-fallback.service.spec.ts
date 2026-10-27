import { describe, expect, it } from 'vitest';
import type { StepFallback } from '@utils';
import { RunStepFallbackService } from './run-step-fallback.service';

describe('RunStepFallbackService', () => {
  const fallback: StepFallback = {
    stepIndex: 4,
    stepType: 'click',
    selector: '[data-testid="add-to-cart"]',
    selectors: ['[data-testid="add-to-cart"]'],
    matchedBy: 'testId',
    value: 'add-to-cart'
  };

  it('keeps the fallbacks of the open run, in order', () => {
    const service = new RunStepFallbackService();
    service.begin('add_to_cart');

    service.record('add_to_cart', fallback);
    service.record('add_to_cart', { ...fallback, stepIndex: 1 });

    expect(service.fallbacks('add_to_cart')).toEqual([
      fallback,
      { ...fallback, stepIndex: 1 }
    ]);
  });

  it('ignores records and reads of another test', () => {
    const service = new RunStepFallbackService();
    service.begin('add_to_cart');

    service.record('purchase', fallback);

    expect(service.fallbacks('add_to_cart')).toEqual([]);
    expect(service.fallbacks('purchase')).toEqual([]);
  });

  it('forgets the run when it ends, and starts over on the next', () => {
    const service = new RunStepFallbackService();
    service.begin('add_to_cart');
    service.record('add_to_cart', fallback);

    service.end('purchase');
    expect(service.fallbacks('add_to_cart')).toEqual([fallback]);

    service.end('add_to_cart');
    expect(service.fallbacks('add_to_cart')).toEqual([]);
    service.record('add_to_cart', fallback);
    expect(service.fallbacks('add_to_cart')).toEqual([]);

    service.begin('add_to_cart');
    expect(service.fallbacks('add_to_cart')).toEqual([]);
  });
});
