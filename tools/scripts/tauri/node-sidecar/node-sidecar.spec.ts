import { describe, expect, it, vi } from 'vitest';
import {
  getNodeSidecarStampPath,
  getRustTargetTriple
} from './node-sidecar.ts';

function spawnResult(input: {
  status?: number | null;
  stdout?: string;
  stderr?: string;
  error?: Error;
}) {
  return {
    status: input.status ?? 0,
    stdout: input.stdout ?? '',
    stderr: input.stderr ?? '',
    error: input.error,
    pid: 0,
    output: [],
    signal: null
  } as unknown as ReturnType<typeof import('node:child_process').spawnSync>;
}

describe('getNodeSidecarStampPath', () => {
  it('returns the stamp path under the supplied binaries directory', () => {
    const result = getNodeSidecarStampPath('/bin');
    expect(result.endsWith('.node-sidecar-stamp.json')).toBe(true);
    expect(result.startsWith('/bin') || result.startsWith('\\bin')).toBe(true);
  });
});

describe('getRustTargetTriple', () => {
  it('returns the trimmed stdout of `rustc --print host-tuple` when it succeeds', () => {
    const spawnSyncFn = vi.fn(() =>
      spawnResult({ status: 0, stdout: '  x86_64-pc-windows-msvc\n' })
    );
    expect(
      getRustTargetTriple({ rootDir: '/r', spawnSyncFn: spawnSyncFn as never })
    ).toBe('x86_64-pc-windows-msvc');
    expect(spawnSyncFn).toHaveBeenCalledTimes(1);
  });

  it('falls back to parsing `rustc -vV` when the preferred command fails', () => {
    let call = 0;
    const spawnSyncFn = vi.fn(() => {
      call += 1;
      if (call === 1) {
        return spawnResult({ status: 1, stderr: 'unknown flag' });
      }
      return spawnResult({
        status: 0,
        stdout: 'rustc 1.0\nhost: aarch64-apple-darwin\nrelease: 1.0\n'
      });
    });

    expect(
      getRustTargetTriple({ rootDir: '/r', spawnSyncFn: spawnSyncFn as never })
    ).toBe('aarch64-apple-darwin');
    expect(spawnSyncFn).toHaveBeenCalledTimes(2);
  });

  it('throws when the fallback rustc invocation fails', () => {
    const spawnSyncFn = vi.fn(() =>
      spawnResult({ status: 1, stderr: 'rustc not installed' })
    );
    expect(() =>
      getRustTargetTriple({ rootDir: '/r', spawnSyncFn: spawnSyncFn as never })
    ).toThrow('rustc not installed');
  });

  it('throws when the fallback output cannot be parsed', () => {
    let call = 0;
    const spawnSyncFn = vi.fn(() => {
      call += 1;
      if (call === 1) {
        return spawnResult({ status: 1 });
      }
      return spawnResult({ status: 0, stdout: 'no host line here' });
    });

    expect(() =>
      getRustTargetTriple({ rootDir: '/r', spawnSyncFn: spawnSyncFn as never })
    ).toThrow(/parse the Rust target triple/);
  });

  it('treats a runtime error from the preferred command as a failure and falls back', () => {
    let call = 0;
    const spawnSyncFn = vi.fn(() => {
      call += 1;
      if (call === 1) {
        return spawnResult({
          status: null,
          error: new Error('command not found')
        });
      }
      return spawnResult({
        status: 0,
        stdout: 'host: x86_64-unknown-linux-gnu\n'
      });
    });

    expect(
      getRustTargetTriple({ rootDir: '/r', spawnSyncFn: spawnSyncFn as never })
    ).toBe('x86_64-unknown-linux-gnu');
  });
});
