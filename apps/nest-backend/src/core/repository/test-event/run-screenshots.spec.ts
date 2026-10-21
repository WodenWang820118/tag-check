import { describe, expect, it } from 'vitest';
import { screenshotsOfRuns } from './run-screenshots';

const at = (time: string) => new Date(`2026-10-21T${time}.000Z`);

describe('screenshotsOfRuns', () => {
  it('returns the screenshot a run is linked to', () => {
    const runs = [
      { id: 1, createdAt: at('10:00:00'), testImage: { id: 11 } },
      { id: 2, createdAt: at('10:05:00'), testImage: { id: 12 } }
    ];
    const screenshots = [
      { id: 11, createdAt: at('10:00:20') },
      { id: 12, createdAt: at('10:05:20') }
    ];

    expect(screenshotsOfRuns(runs, screenshots, new Set([2]))).toEqual([12]);
  });

  it("pairs an unlinked run with the screenshot saved before the test's next run", () => {
    const runs = [
      { id: 1, createdAt: at('10:00:00') },
      { id: 2, createdAt: at('10:05:00') },
      { id: 3, createdAt: at('10:10:00'), testImage: { id: 13 } }
    ];
    const screenshots = [
      { id: 11, createdAt: at('10:00:20') },
      { id: 12, createdAt: at('10:05:20') },
      { id: 13, createdAt: at('10:10:20') }
    ];

    expect(screenshotsOfRuns(runs, screenshots, new Set([1, 2]))).toEqual([
      11, 12
    ]);
  });

  it('pairs nothing when a run saved no screenshot', () => {
    // Run 1 failed before its screenshot; 11 belongs to run 2.
    const runs = [
      { id: 1, createdAt: at('10:00:00') },
      { id: 2, createdAt: at('10:05:00') }
    ];
    const screenshots = [{ id: 11, createdAt: at('10:05:20') }];

    expect(screenshotsOfRuns(runs, screenshots, new Set([1]))).toEqual([]);
    expect(screenshotsOfRuns(runs, screenshots, new Set([2]))).toEqual([11]);
  });

  it('gives a screenshot to one run only', () => {
    // A failed run saves a fallback result in the same second as the first.
    const runs = [
      { id: 1, createdAt: at('10:00:00') },
      { id: 2, createdAt: at('10:00:00') }
    ];
    const screenshots = [{ id: 11, createdAt: at('10:00:05') }];

    expect(screenshotsOfRuns(runs, screenshots, new Set([1, 2]))).toEqual([11]);
  });
});
