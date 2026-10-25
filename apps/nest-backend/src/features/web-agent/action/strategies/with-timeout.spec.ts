import { afterEach, describe, expect, it, vi } from 'vitest';
import { withTimeout } from './with-timeout';

describe('withTimeout', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves with the operation and clears its timer', async () => {
    vi.useFakeTimers();

    await expect(
      withTimeout(Promise.resolve('done'), 5000, 'late')
    ).resolves.toBe('done');

    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects with the operation error and clears its timer', async () => {
    vi.useFakeTimers();

    await expect(
      withTimeout(Promise.reject(new Error('boom')), 5000, 'late')
    ).rejects.toThrow('boom');

    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects with the message when the operation takes too long', async () => {
    vi.useFakeTimers();
    const result = withTimeout(new Promise(() => undefined), 5000, 'late');
    const assertion = expect(result).rejects.toThrow('late');

    await vi.advanceTimersByTimeAsync(5000);

    await assertion;
  });
});
