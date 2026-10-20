import { describe, expect, it, vi } from 'vitest';
import type { Page } from 'puppeteer';
import { preferSelector, waitForAnySelector } from './utils';

/** A page whose selectors appear after the given delays (ms); others never do. */
function pageWith(appearAfter: Record<string, number>) {
  const signals: AbortSignal[] = [];
  const waitForSelector = vi.fn(
    (selector: string, options: { timeout: number; signal: AbortSignal }) => {
      signals.push(options.signal);
      return new Promise((resolve, reject) => {
        const delay = appearAfter[selector];
        const timer = setTimeout(
          () =>
            delay === undefined
              ? reject(new Error(`Waiting for selector \`${selector}\` failed`))
              : resolve({}),
          delay ?? options.timeout
        );
        options.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('aborted'));
        });
      });
    }
  );
  return {
    page: { waitForSelector } as unknown as Page,
    waitForSelector,
    signals
  };
}

describe('waitForAnySelector', () => {
  it('resolves the selector that becomes visible first', async () => {
    const { page } = pageWith({ '#late': 40, '#early': 5 });
    await expect(
      waitForAnySelector(page, ['#missing', '#late', '#early'], 200)
    ).resolves.toBe('#early');
  });

  it('waits for every selector at once, under one timeout', async () => {
    const { page, waitForSelector } = pageWith({ '#b': 5 });
    await waitForAnySelector(page, ['#a', '#b'], 200);
    expect(waitForSelector).toHaveBeenCalledTimes(2);
    for (const [, options] of waitForSelector.mock.calls) {
      expect(options).toMatchObject({ timeout: 200, visible: true });
    }
  });

  it('cancels the waits that lost the race', async () => {
    const { page, signals } = pageWith({ '#b': 5 });
    await waitForAnySelector(page, ['#a', '#b'], 200);
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });

  it('returns null when no selector appears in time', async () => {
    const { page } = pageWith({});
    await expect(
      waitForAnySelector(page, ['#a', '#b'], 20)
    ).resolves.toBeNull();
  });

  it('returns null without waiting when there are no selectors', async () => {
    const { page, waitForSelector } = pageWith({});
    await expect(waitForAnySelector(page, [], 20)).resolves.toBeNull();
    expect(waitForSelector).not.toHaveBeenCalled();
  });
});

describe('preferSelector', () => {
  it('moves the visible selector to the front', () => {
    expect(preferSelector(['#a', '#b', '#c'], '#b')).toEqual([
      '#b',
      '#a',
      '#c'
    ]);
  });

  it('keeps the recorded order when nothing appeared', () => {
    expect(preferSelector(['#a', '#b'], null)).toEqual(['#a', '#b']);
  });
});
