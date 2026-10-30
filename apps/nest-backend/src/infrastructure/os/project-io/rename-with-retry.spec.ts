import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renameSync } from 'fs';
import { renameWithRetry } from './rename-with-retry';

vi.mock('fs', () => ({ renameSync: vi.fn() }));

describe('renameWithRetry', () => {
  beforeEach(() => {
    vi.mocked(renameSync).mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renames immediately when there is no error', async () => {
    await renameWithRetry('source', 'destination');

    expect(renameSync).toHaveBeenCalledExactlyOnceWith('source', 'destination');
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['EPERM', 'EACCES', 'EBUSY'])(
    'retries %s and then succeeds',
    async (code) => {
      const error = Object.assign(new Error('folder is busy'), { code });
      vi.mocked(renameSync).mockImplementationOnce(() => {
        throw error;
      });

      const result = renameWithRetry('source', 'destination');
      expect(renameSync).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(99);
      expect(renameSync).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);

      await expect(result).resolves.toBeUndefined();
      expect(renameSync).toHaveBeenCalledTimes(2);
      expect(renameSync).toHaveBeenLastCalledWith('source', 'destination');
      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it.each(['ENOENT', 'EXDEV', 'ENOTEMPTY'])(
    'throws %s immediately without retrying',
    async (code) => {
      const error = Object.assign(new Error('rename failed'), { code });
      vi.mocked(renameSync).mockImplementation(() => {
        throw error;
      });

      await expect(renameWithRetry('source', 'destination')).rejects.toBe(
        error
      );

      expect(renameSync).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it.each([new Error('no error code'), null, 'unknown error'])(
    'throws an error without a code immediately: %j',
    async (error) => {
      vi.mocked(renameSync).mockImplementation(() => {
        throw error;
      });

      await expect(renameWithRetry('source', 'destination')).rejects.toBe(
        error
      );

      expect(renameSync).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    }
  );

  it('throws the last error after the ten-second retry budget', async () => {
    const firstError = Object.assign(new Error('permission denied'), {
      code: 'EPERM'
    });
    const lastError = Object.assign(new Error('still busy'), { code: 'EBUSY' });
    vi.mocked(renameSync)
      .mockImplementationOnce(() => {
        throw firstError;
      })
      .mockImplementation(() => {
        throw lastError;
      });

    const result = renameWithRetry('source', 'destination');
    const rejection = expect(result).rejects.toBe(lastError);
    await vi.advanceTimersByTimeAsync(9_999);
    expect(renameSync).toHaveBeenCalledTimes(13);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await rejection;

    expect(Date.now()).toBe(10_000);
    expect(renameSync).toHaveBeenCalledTimes(14);
    expect(vi.getTimerCount()).toBe(0);
  });
});
