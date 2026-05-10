import { describe, expect, it, vi } from 'vitest';
import { join } from 'node:path';
import {
  buildBackendRuntimeNpmCommand,
  buildBackendRuntimeInstallStamp,
  getBackendRuntimeInstallPlan,
  getBackendRuntimeStampPath
} from './backend-runtime.ts';

describe('getBackendRuntimeInstallPlan', () => {
  it('uses npm ci with install fallback when a package-lock exists', () => {
    expect(getBackendRuntimeInstallPlan(true)).toEqual({
      fallbackCommand: 'install',
      primaryCommand: 'ci',
      removeLockfileBeforeFallback: true
    });
  });

  it('uses npm install with no fallback when no package-lock exists', () => {
    expect(getBackendRuntimeInstallPlan(false)).toEqual({
      fallbackCommand: null,
      primaryCommand: 'install',
      removeLockfileBeforeFallback: false
    });
  });
});

describe('buildBackendRuntimeNpmCommand', () => {
  it('builds npm runtime install args without invoking npm through node', () => {
    expect(buildBackendRuntimeNpmCommand('ci', 'linux')).toEqual({
      args: ['ci', '--omit=dev', '--no-audit', '--no-fund'],
      command: 'npm',
      shell: false
    });
  });

  it('uses shell execution for Windows npm shims', () => {
    expect(buildBackendRuntimeNpmCommand('install', 'win32')).toEqual({
      args: ['install', '--omit=dev', '--no-audit', '--no-fund'],
      command: 'npm',
      shell: true
    });
  });
});

describe('getBackendRuntimeStampPath', () => {
  it('returns the .install-stamp.json path under the backend directory', () => {
    expect(getBackendRuntimeStampPath('/work/backend')).toBe(
      join('/work/backend', '.install-stamp.json')
    );
  });
});

describe('buildBackendRuntimeInstallStamp', () => {
  it('hashes package.json and package-lock.json when both exist', () => {
    const hashFileFn = vi.fn((path: string) =>
      path.endsWith('package-lock.json') ? 'lock-hash' : 'pkg-hash'
    );
    const stamp = buildBackendRuntimeInstallStamp('/work/backend', {
      arch: 'x64',
      existsSyncFn: () => true,
      hashFileFn,
      nodeVersion: 'v20.0.0',
      platform: 'linux'
    });

    expect(stamp).toEqual({
      arch: 'x64',
      nodeVersion: 'v20.0.0',
      packageJsonHash: 'pkg-hash',
      packageLockHash: 'lock-hash',
      platform: 'linux',
      version: 1
    });
    expect(hashFileFn).toHaveBeenCalledWith(
      join('/work/backend', 'package.json')
    );
    expect(hashFileFn).toHaveBeenCalledWith(
      join('/work/backend', 'package-lock.json')
    );
  });

  it('sets packageLockHash to null when package-lock.json is absent', () => {
    const hashFileFn = vi.fn(() => 'pkg-hash');
    const stamp = buildBackendRuntimeInstallStamp('/work/backend', {
      arch: 'arm64',
      existsSyncFn: () => false,
      hashFileFn,
      nodeVersion: 'v20.0.0',
      platform: 'darwin'
    });

    expect(stamp.packageLockHash).toBeNull();
    expect(stamp.packageJsonHash).toBe('pkg-hash');
    // package-lock should not be hashed when missing
    expect(hashFileFn).toHaveBeenCalledTimes(1);
  });

  it('falls back to process arch/version/platform when not supplied', () => {
    const stamp = buildBackendRuntimeInstallStamp('/work/backend', {
      existsSyncFn: () => false,
      hashFileFn: () => 'h'
    });
    expect(stamp.arch).toBe(process.arch);
    expect(stamp.nodeVersion).toBe(process.version);
    expect(stamp.platform).toBe(process.platform);
    expect(stamp.version).toBe(1);
  });
});
