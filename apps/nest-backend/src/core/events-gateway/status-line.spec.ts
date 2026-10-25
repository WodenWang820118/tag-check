import { describe, expect, it } from 'vitest';
import {
  formatStatusLine,
  STATUS_LINE_PREFIX,
  STATUS_STDOUT_ENV,
  statusLineWriterFromEnv
} from './status-line';

function fakeStdout() {
  const chunks: string[] = [];
  return { chunks, write: (chunk: string) => chunks.push(chunk) };
}

describe('statusLineWriterFromEnv', () => {
  it('writes status lines to stdout when the desktop app asks for them', () => {
    const stdout = fakeStdout();

    const write = statusLineWriterFromEnv({ [STATUS_STDOUT_ENV]: '1' }, stdout);
    write?.('TAGCHECK_STATUS {}\n');

    expect(stdout.chunks).toEqual(['TAGCHECK_STATUS {}\n']);
  });

  it.each([
    ['unset', {}],
    ['empty', { [STATUS_STDOUT_ENV]: '' }],
    ['0', { [STATUS_STDOUT_ENV]: '0' }],
    ['true', { [STATUS_STDOUT_ENV]: 'true' }]
  ])('writes nothing when the variable is %s', (_label, env) => {
    expect(statusLineWriterFromEnv(env, fakeStdout())).toBeNull();
  });

  it('swallows a failed write', () => {
    const write = statusLineWriterFromEnv(
      { [STATUS_STDOUT_ENV]: '1' },
      {
        write: () => {
          throw new Error('EPIPE');
        }
      }
    );

    expect(() => write?.('line\n')).not.toThrow();
  });
});

describe('formatStatusLine', () => {
  it('writes the prefix, compact JSON and one newline', () => {
    const line = formatStatusLine({
      type: 'runStatus',
      data: { state: 'idle' }
    });

    expect(line).toBe(
      'TAGCHECK_STATUS {"type":"runStatus","data":{"state":"idle"}}\n'
    );
    expect(line.startsWith(STATUS_LINE_PREFIX)).toBe(true);
  });

  it('keeps a message with line breaks on one line', () => {
    const line = formatStatusLine({
      type: 'runFinished',
      data: {
        projectSlug: 'shop',
        eventId: 'evt',
        eventName: 'add_to_cart',
        testName: 'Add to cart',
        status: 'error',
        message: 'first\nsecond\r\nthird'
      }
    });

    expect(line.indexOf('\n')).toBe(line.length - 1);
    expect(line).not.toContain('\r');
    expect(JSON.parse(line.slice(STATUS_LINE_PREFIX.length)).data.message).toBe(
      'first\nsecond\r\nthird'
    );
  });
});
