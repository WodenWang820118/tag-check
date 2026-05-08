import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  isDirectEntrypoint,
  normalizeToolPath,
  resolveWorkspaceRootFromModuleUrl
} from './paths.ts';

describe('normalizeToolPath', () => {
  it('converts backslashes to forward slashes and trims surrounding whitespace', () => {
    expect(normalizeToolPath('  src\\foo\\bar.ts  ')).toBe('src/foo/bar.ts');
  });

  it('strips a leading "./" prefix', () => {
    expect(normalizeToolPath('./src/foo.ts')).toBe('src/foo.ts');
  });
});

describe('resolveWorkspaceRootFromModuleUrl', () => {
  it('walks the requested number of parent directories from the module url', () => {
    const moduleUrl = pathToFileURL(
      resolve('tools/scripts/shared/paths.ts')
    ).href;
    expect(resolveWorkspaceRootFromModuleUrl(moduleUrl, 3)).toBe(resolve('.'));
    expect(resolveWorkspaceRootFromModuleUrl(moduleUrl, 1)).toBe(
      resolve('tools/scripts')
    );
  });
});

describe('isDirectEntrypoint', () => {
  it('returns true when the module url matches argv[1]', () => {
    const moduleUrl = pathToFileURL(
      resolve('tools/scripts/shared/paths.ts')
    ).href;
    expect(
      isDirectEntrypoint(moduleUrl, ['node', 'tools/scripts/shared/paths.ts'])
    ).toBe(true);
  });

  it('returns false when argv[1] is missing', () => {
    expect(isDirectEntrypoint('file:///x.ts', ['node'])).toBe(false);
  });

  it('returns false when argv[1] does not match the module url', () => {
    const moduleUrl = pathToFileURL(
      resolve('tools/scripts/shared/paths.ts')
    ).href;
    expect(isDirectEntrypoint(moduleUrl, ['node', 'something/else.ts'])).toBe(
      false
    );
  });
});
