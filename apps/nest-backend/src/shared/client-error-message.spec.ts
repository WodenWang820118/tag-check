import { describe, expect, it } from 'vitest';
import { toClientErrorMessage } from './client-error-message';

describe('toClientErrorMessage', () => {
  it('keeps a plain message', () => {
    expect(
      toClientErrorMessage(
        new Error(
          'Failed to operate GTM preview control "#domain-start-button": TimeoutError: Waiting for selector `#domain-start-button` failed'
        )
      )
    ).toBe(
      'Failed to operate GTM preview control "#domain-start-button": TimeoutError: Waiting for selector `#domain-start-button` failed'
    );
  });

  it('keeps only the first line and leaves the stack out', () => {
    const error = new Error(
      'Failed to launch the browser process!\n[1234:ERROR] crashpad\nTROUBLESHOOTING: https://pptr.dev/troubleshooting'
    );

    const reason = toClientErrorMessage(error);

    expect(reason).toBe('Failed to launch the browser process!');
    expect(reason).not.toContain('at ');
  });

  it('replaces Windows, UNC and POSIX file paths', () => {
    expect(
      toClientErrorMessage(
        new Error(
          'spawn C:\\Users\\me\\AppData\\ffmpeg.exe ENOENT, see \\\\server\\share\\log.txt or /home/me/.cache/chrome/linux/chrome'
        )
      )
    ).toBe('spawn <path> ENOENT, see <path> or <path>');
  });

  it('keeps URLs', () => {
    expect(
      toClientErrorMessage(
        new Error('net::ERR_NAME_NOT_RESOLVED at https://shop.test/a/b')
      )
    ).toBe('net::ERR_NAME_NOT_RESOLVED at https://shop.test/a/b');
  });

  it('shortens a long message and reads non-errors', () => {
    expect(toClientErrorMessage(new Error('x'.repeat(500)))).toHaveLength(300);
    expect(toClientErrorMessage('boom')).toBe('boom');
    expect(toClientErrorMessage(undefined)).toBe('');
  });
});
