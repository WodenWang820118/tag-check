import { describe, expect, it } from 'vitest';
import {
  buildShellCommandLine,
  encodePowerShellCommand,
  getPnpmCommand,
  getShellSafePackageManagerCommand,
  quoteWindowsArg,
  sanitizeEnv
} from './process.ts';

describe('getPnpmCommand', () => {
  it('returns either pnpm or pnpm.cmd depending on platform', () => {
    const expected = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    expect(getPnpmCommand()).toBe(expected);
  });
});

describe('getShellSafePackageManagerCommand', () => {
  it('uses shell execution on Windows package manager shims', () => {
    expect(getShellSafePackageManagerCommand('pnpm', 'win32')).toEqual({
      command: 'pnpm',
      shell: true
    });
    expect(getShellSafePackageManagerCommand('npm', 'win32')).toEqual({
      command: 'npm',
      shell: true
    });
  });

  it('keeps direct execution on non-Windows platforms', () => {
    expect(getShellSafePackageManagerCommand('pnpm', 'linux')).toEqual({
      command: 'pnpm',
      shell: false
    });
    expect(getShellSafePackageManagerCommand('npm', 'darwin')).toEqual({
      command: 'npm',
      shell: false
    });
  });
});

describe('sanitizeEnv', () => {
  it('returns undefined when env is undefined', () => {
    expect(sanitizeEnv(undefined)).toBeUndefined();
  });

  it('keeps string values and drops undefined values', () => {
    const result = sanitizeEnv({ FOO: 'bar', BAZ: undefined, QUX: 'quux' });
    expect(result).toEqual({ FOO: 'bar', QUX: 'quux' });
  });

  it('returns an empty object when all values are undefined', () => {
    expect(sanitizeEnv({ A: undefined, B: undefined })).toEqual({});
  });
});

describe('quoteWindowsArg', () => {
  it('returns "" for an empty string', () => {
    expect(quoteWindowsArg('')).toBe('""');
  });

  it('returns the value unchanged when no special chars are present', () => {
    expect(quoteWindowsArg('plain-value')).toBe('plain-value');
  });

  it('wraps values containing spaces in double quotes', () => {
    expect(quoteWindowsArg('hello world')).toBe('"hello world"');
  });

  it('escapes embedded double quotes with a backslash', () => {
    expect(quoteWindowsArg('he said "hi"')).toBe('"he said \\"hi\\""');
  });

  it.each(['a&b', 'a|b', 'a<b', 'a>b', 'a(b', 'a)b', 'a^b', 'a\tb'])(
    'wraps values containing the cmd metachar in %s',
    (value) => {
      expect(quoteWindowsArg(value).startsWith('"')).toBe(true);
      expect(quoteWindowsArg(value).endsWith('"')).toBe(true);
    }
  );
});

describe('buildShellCommandLine', () => {
  it('quotes Windows command lines before shell execution', () => {
    expect(
      buildShellCommandLine('npm', ['install', 'two words', 'a&b'], 'win32')
    ).toBe('npm install "two words" "a&b"');
  });

  it('quotes POSIX command lines before shell execution', () => {
    expect(
      buildShellCommandLine('pnpm', ['nx', 'run', "tag-check's:build"], 'linux')
    ).toBe("pnpm nx run 'tag-check'\\''s:build'");
  });
});

describe('encodePowerShellCommand', () => {
  it('encodes the command as UTF-16LE base64', () => {
    const encoded = encodePowerShellCommand('Get-ChildItem');
    expect(encoded).toBe(
      Buffer.from('Get-ChildItem', 'utf16le').toString('base64')
    );
    // round-trip
    expect(Buffer.from(encoded, 'base64').toString('utf16le')).toBe(
      'Get-ChildItem'
    );
  });

  it('round-trips unicode content losslessly', () => {
    const command = 'Write-Host "héllo 🌍"';
    const encoded = encodePowerShellCommand(command);
    expect(Buffer.from(encoded, 'base64').toString('utf16le')).toBe(command);
  });
});
