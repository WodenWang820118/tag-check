import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  getBackendRuntimeInstallPlan,
  prepareBackendRuntime
} from './prepare-runtime.ts';

describe('getBackendRuntimeInstallPlan', () => {
  it('prefers npm ci when a dist lockfile already exists', () => {
    expect(getBackendRuntimeInstallPlan(true)).toEqual({
      fallbackCommand: 'install',
      primaryCommand: 'ci',
      removeLockfileBeforeFallback: true
    });
  });

  it('uses npm install directly when no dist lockfile is available yet', () => {
    expect(getBackendRuntimeInstallPlan(false)).toEqual({
      fallbackCommand: null,
      primaryCommand: 'install',
      removeLockfileBeforeFallback: false
    });
  });
});

describe('prepareBackendRuntime', () => {
  it('throws when the generated backend package.json is missing', () => {
    expect(() =>
      prepareBackendRuntime({
        backendDir: 'backend-dist-test',
        existsSyncFn() {
          return false;
        },
        removePathFn() {
          throw new Error('removePathFn must not be called');
        },
        runFn() {
          throw new Error('runFn must not be called');
        },
        tryRunFn() {
          throw new Error('tryRunFn must not be called');
        },
        warnFn() {
          throw new Error('warnFn must not be called');
        }
      })
    ).toThrow(
      'Missing generated backend package.json in backend-dist-test'
    );
  });

  it('returns early without fallback when npm ci succeeds with a lockfile', () => {
    const backendDir = 'backend-dist-test';
    const packageJsonPath = join(backendDir, 'package.json');
    const packageLockPath = join(backendDir, 'package-lock.json');
    const existsCalls: string[] = [];
    const removedPaths: string[] = [];
    const tryRunCalls: Array<{
      args: string[];
      command: string;
      cwd: string;
    }> = [];
    const runCalls: Array<{
      args: string[];
      command: string;
      cwd: string;
    }> = [];
    const warnings: string[] = [];

    prepareBackendRuntime({
      backendDir,
      existsSyncFn(targetPath) {
        existsCalls.push(targetPath);
        return targetPath === packageJsonPath || targetPath === packageLockPath;
      },
      removePathFn(targetPath) {
        removedPaths.push(targetPath);
      },
      runFn(command, args, cwd) {
        runCalls.push({ args, command, cwd });
      },
      tryRunFn(command, args, cwd) {
        tryRunCalls.push({ args, command, cwd });
        return true;
      },
      warnFn(message) {
        warnings.push(message);
      }
    });

    expect(removedPaths).toEqual([join(backendDir, 'node_modules')]);
    expect(existsCalls).toEqual([packageJsonPath, packageLockPath]);
    expect(tryRunCalls).toHaveLength(1);
    expect(tryRunCalls[0]).toMatchObject({
      command: process.execPath,
      cwd: backendDir
    });
    expect(tryRunCalls[0]?.args[0]).toContain('npm-cli.js');
    expect(tryRunCalls[0]?.args[1]).toBe('ci');
    expect(tryRunCalls[0]?.args[2]).toBe('--omit=dev');
    expect(runCalls).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it('retries with npm install after npm ci fails against a stale dist lockfile', () => {
    const backendDir = 'backend-dist-test';
    const packageJsonPath = join(backendDir, 'package.json');
    const packageLockPath = join(backendDir, 'package-lock.json');
    const nodeModulesPath = join(backendDir, 'node_modules');
    const removedPaths: string[] = [];
    const tryRunCalls: Array<{
      args: string[];
      command: string;
      cwd: string;
    }> = [];
    const runCalls: Array<{
      args: string[];
      command: string;
      cwd: string;
    }> = [];
    const warnings: string[] = [];
    const existsCalls: string[] = [];

    prepareBackendRuntime({
      backendDir,
      existsSyncFn(targetPath) {
        existsCalls.push(targetPath);
        return targetPath === packageJsonPath || targetPath === packageLockPath;
      },
      removePathFn(targetPath) {
        removedPaths.push(targetPath);
      },
      runFn(command, args, cwd) {
        runCalls.push({ args, command, cwd });
      },
      tryRunFn(command, args, cwd) {
        tryRunCalls.push({ args, command, cwd });
        return false;
      },
      warnFn(message) {
        warnings.push(message);
      }
    });

    expect(tryRunCalls).toHaveLength(1);
    expect(existsCalls).toEqual([packageJsonPath, packageLockPath]);
    expect(tryRunCalls[0]).toMatchObject({
      command: process.execPath,
      cwd: backendDir
    });
    expect(tryRunCalls[0]?.args[0]).toContain('npm-cli.js');
    expect(tryRunCalls[0]?.args[1]).toBe('ci');
    expect(tryRunCalls[0]?.args[2]).toBe('--omit=dev');
    expect(removedPaths).toEqual([
      nodeModulesPath,
      nodeModulesPath,
      packageLockPath
    ]);
    expect(runCalls).toHaveLength(1);
    expect(runCalls[0]).toMatchObject({
      command: process.execPath,
      cwd: backendDir
    });
    expect(runCalls[0]?.args[0]).toContain('npm-cli.js');
    expect(runCalls[0]?.args[1]).toBe('install');
    expect(runCalls[0]?.args[2]).toBe('--omit=dev');
    expect(warnings).toEqual([
      `npm ci failed in ${backendDir}. Falling back to npm install to regenerate runtime dependencies.`
    ]);
  });

  it('returns early with npm install when no lockfile is present and install succeeds', () => {
    const backendDir = 'backend-dist-test';
    const packageJsonPath = join(backendDir, 'package.json');
    const removedPaths: string[] = [];
    const tryRunCalls: Array<{
      args: string[];
      command: string;
      cwd: string;
    }> = [];
    const runCalls: Array<{
      args: string[];
      command: string;
      cwd: string;
    }> = [];
    const warnings: string[] = [];
    const existsCalls: string[] = [];

    prepareBackendRuntime({
      backendDir,
      existsSyncFn(targetPath) {
        existsCalls.push(targetPath);
        return targetPath === packageJsonPath;
      },
      removePathFn(targetPath) {
        removedPaths.push(targetPath);
      },
      runFn(command, args, cwd) {
        runCalls.push({ args, command, cwd });
      },
      tryRunFn(command, args, cwd) {
        tryRunCalls.push({ args, command, cwd });
        return true;
      },
      warnFn(message) {
        warnings.push(message);
      }
    });

    expect(removedPaths).toEqual([join(backendDir, 'node_modules')]);
    expect(existsCalls).toEqual([packageJsonPath, join(backendDir, 'package-lock.json')]);
    expect(tryRunCalls).toHaveLength(1);
    expect(tryRunCalls[0]).toMatchObject({
      command: process.execPath,
      cwd: backendDir
    });
    expect(tryRunCalls[0]?.args[0]).toContain('npm-cli.js');
    expect(tryRunCalls[0]?.args[1]).toBe('install');
    expect(tryRunCalls[0]?.args[2]).toBe('--omit=dev');
    expect(runCalls).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it('throws when npm install fails and no lockfile is available', () => {
    const backendDir = 'backend-dist-test';
    const packageJsonPath = join(backendDir, 'package.json');
    const removedPaths: string[] = [];
    const runCalls: Array<{
      args: string[];
      command: string;
      cwd: string;
    }> = [];

    expect(() =>
      prepareBackendRuntime({
        backendDir,
        existsSyncFn(targetPath) {
          return targetPath === packageJsonPath;
        },
        removePathFn(targetPath) {
          removedPaths.push(targetPath);
        },
        runFn(command, args, cwd) {
          runCalls.push({ args, command, cwd });
        },
        tryRunFn() {
          return false;
        },
        warnFn() {}
      })
    ).toThrow(`Command failed: ${process.execPath}`);

    expect(removedPaths).toEqual([join(backendDir, 'node_modules')]);
    expect(runCalls).toEqual([]);
  });

  it('propagates when the fallback npm install also fails', () => {
    const backendDir = 'backend-dist-test';
    const packageJsonPath = join(backendDir, 'package.json');
    const packageLockPath = join(backendDir, 'package-lock.json');
    const nodeModulesPath = join(backendDir, 'node_modules');
    const removedPaths: string[] = [];
    const warnings: string[] = [];

    expect(() =>
      prepareBackendRuntime({
        backendDir,
        existsSyncFn(targetPath) {
          return targetPath === packageJsonPath || targetPath === packageLockPath;
        },
        removePathFn(targetPath) {
          removedPaths.push(targetPath);
        },
        runFn(command, args) {
          throw new Error(`Command failed: ${command} ${args.join(' ')}`);
        },
        tryRunFn() {
          return false;
        },
        warnFn(message) {
          warnings.push(message);
        }
      })
    ).toThrow(`Command failed: ${process.execPath}`);

    expect(removedPaths).toEqual([
      nodeModulesPath,
      nodeModulesPath,
      packageLockPath
    ]);
    expect(warnings).toEqual([
      `npm ci failed in ${backendDir}. Falling back to npm install to regenerate runtime dependencies.`
    ]);
  });
});
