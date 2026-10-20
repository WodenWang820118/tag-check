import { describe, expect, it, vi } from 'vitest';
import type { Page } from 'puppeteer';
import { preferSelector, waitForAnySelector } from './utils';

const named = (name: string, message: string) =>
  Object.assign(new Error(message), { name });

/**
 * A page whose selectors appear after the given delays (ms). The others time
 * out like Puppeteer (TimeoutError), and aborted waits reject with AbortError.
 */
function pageWith(appearAfter: Record<string, number>) {
  const signals: AbortSignal[] = [];
  const handles: { dispose: ReturnType<typeof vi.fn> }[] = [];
  const waitForSelector = vi.fn(
    (
      selector: string,
      options: { timeout: number; visible: boolean; signal: AbortSignal }
    ) => {
      signals.push(options.signal);
      return new Promise((resolve, reject) => {
        const delay = appearAfter[selector];
        const timer = setTimeout(() => {
          if (delay === undefined) {
            reject(
              named(
                'TimeoutError',
                `Waiting for selector \`${selector}\` failed`
              )
            );
            return;
          }
          const handle = { dispose: vi.fn(async () => undefined) };
          handles.push(handle);
          resolve(handle);
        }, delay ?? options.timeout);
        options.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(named('AbortError', 'aborted'));
        });
      });
    }
  );
  return {
    page: { waitForSelector } as unknown as Page,
    waitForSelector,
    signals,
    handles
  };
}

describe('waitForAnySelector', () => {
  it('resolves the selector that appears first', async () => {
    const { page } = pageWith({ '#late': 40, '#early': 5 });
    await expect(
      waitForAnySelector(page, ['#missing', '#late', '#early'], {
        timeout: 200
      })
    ).resolves.toBe('#early');
  });

  it('waits for every selector at once, under one timeout', async () => {
    const { page, waitForSelector } = pageWith({ '#b': 5 });
    await waitForAnySelector(page, ['#a', '#b'], { timeout: 200 });
    expect(waitForSelector).toHaveBeenCalledTimes(2);
    for (const [, options] of waitForSelector.mock.calls) {
      expect(options).toMatchObject({ timeout: 200, visible: true });
    }
  });

  it('can wait for presence instead of visibility', async () => {
    const { page, waitForSelector } = pageWith({ '#a': 1 });
    await waitForAnySelector(page, ['#a'], { timeout: 200, visible: false });
    expect(waitForSelector.mock.calls[0][1]).toMatchObject({ visible: false });
  });

  it('cancels the waits that lost the race', async () => {
    const { page, signals } = pageWith({ '#b': 5 });
    await waitForAnySelector(page, ['#a', '#b'], { timeout: 200 });
    expect(signals.every((signal) => signal.aborted)).toBe(true);
  });

  it('releases the element handle of the selector that appeared', async () => {
    const { page, handles } = pageWith({ '#a': 1 });
    await waitForAnySelector(page, ['#a'], { timeout: 200 });
    expect(handles[0].dispose).toHaveBeenCalled();
  });

  it('returns null when no selector appears in time', async () => {
    const { page } = pageWith({});
    await expect(
      waitForAnySelector(page, ['#a', '#b'], { timeout: 20 })
    ).resolves.toBeNull();
  });

  it('rethrows a failure that is not a timeout', async () => {
    const detached = new Error('Attempted to use detached Frame');
    const page = {
      waitForSelector: vi.fn().mockRejectedValue(detached)
    } as unknown as Page;
    await expect(
      waitForAnySelector(page, ['#a'], { timeout: 20 })
    ).rejects.toBe(detached);
  });

  it('rethrows a synchronous throw instead of swallowing it', async () => {
    const page = {
      waitForSelector: () => {
        throw new TypeError('waitForSelector is not a function');
      }
    } as unknown as Page;
    await expect(
      waitForAnySelector(page, ['#a'], { timeout: 20 })
    ).rejects.toBeInstanceOf(TypeError);
  });

  it('returns null without waiting when there are no selectors', async () => {
    const { page, waitForSelector } = pageWith({});
    await expect(
      waitForAnySelector(page, [], { timeout: 20 })
    ).resolves.toBeNull();
    expect(waitForSelector).not.toHaveBeenCalled();
  });
});

describe('preferSelector', () => {
  it('moves the selector that appeared to the front', () => {
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
