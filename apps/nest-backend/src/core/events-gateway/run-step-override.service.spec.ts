import { describe, expect, it } from 'vitest';
import { RunStepOverrideService } from './run-step-override.service';

describe('RunStepOverrideService', () => {
  it("gives the override's selectors to its step of its run only", () => {
    const overrides = new RunStepOverrideService();
    overrides.begin('e1', { stepIndex: 4, selectors: ['#new'] });

    expect(overrides.selectorsFor('e1', 4)).toEqual(['#new']);
    expect(overrides.selectorsFor('e1', 3)).toBeNull();
    expect(overrides.selectorsFor('e2', 4)).toBeNull();
  });

  it('closes when its run ends, not when another does', () => {
    const overrides = new RunStepOverrideService();
    overrides.begin('e1', { stepIndex: 0, selectors: ['#new'] });

    overrides.end('e2');
    expect(overrides.selectorsFor('e1', 0)).toEqual(['#new']);
    overrides.end('e1');
    expect(overrides.selectorsFor('e1', 0)).toBeNull();
  });

  it('a run without an override replaces one left open', () => {
    const overrides = new RunStepOverrideService();
    overrides.begin('e1', { stepIndex: 0, selectors: ['#new'] });

    overrides.begin('e1', null);

    expect(overrides.selectorsFor('e1', 0)).toBeNull();
  });
});
