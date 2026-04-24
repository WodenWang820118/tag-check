import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildBackendApplication,
  getBackendRuntimeInstallPlan,
  buildStopExistingDesktopSidecarsScript,
  getDefaultDesktopNodePaths,
  getRustTargetTriple,
  main,
  prepareBackendRuntime
} from './prepare-runtime.ts';
import {
  prepareNodeSidecar,
  stopExistingDesktopSidecars
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
    ).toThrow('Missing generated backend package.json in backend-dist-test');
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

  it('uses an injected node executable when preparing runtime dependencies', () => {
    const backendDir = 'backend-dist-test';
    const packageJsonPath = join(backendDir, 'package.json');
    const tryRunCalls: Array<{
      args: string[];
      command: string;
      cwd: string;
    }> = [];

    prepareBackendRuntime({
      backendDir,
      existsSyncFn(targetPath) {
        return targetPath === packageJsonPath;
      },
      nodeExecPath: 'injected-node.exe',
      removePathFn() {
        return undefined;
      },
      runFn() {
        throw new Error('runFn must not be called');
      },
      tryRunFn(command, args, cwd) {
        tryRunCalls.push({ args, command, cwd });
        return true;
      },
      warnFn() {
        return undefined;
      }
    });

    expect(tryRunCalls).toHaveLength(1);
    expect(tryRunCalls[0]).toMatchObject({
      command: 'injected-node.exe',
      cwd: backendDir
    });
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
    expect(existsCalls).toEqual([
      packageJsonPath,
      join(backendDir, 'package-lock.json')
    ]);
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
        warnFn() {
          return undefined;
        }
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
          return (
            targetPath === packageJsonPath || targetPath === packageLockPath
          );
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

describe('buildBackendApplication', () => {
  it('runs the backend build through nx using the resolved workspace root', () => {
    const calls: Array<{ command: string; args: string[]; cwd: string }> = [];

    buildBackendApplication({
      nodeExecPath: 'node.exe',
      rootDir: 'workspace-root',
      runFn(command, args, cwd) {
        calls.push({ command, args, cwd });
      }
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      command: 'node.exe',
      cwd: 'workspace-root'
    });
    expect(calls[0]?.args[0]).toBe(
      join('workspace-root', 'node_modules', 'nx', 'bin', 'nx.js')
    );
    expect(calls[0]?.args.slice(1)).toEqual(['build', 'nest-backend']);
  });
});

describe('main', () => {
  it('runs the prepare-runtime orchestration in the expected order', () => {
    const calls: string[] = [];

    main({
      buildBackendApplicationFn() {
        calls.push('build-backend');
      },
      stopExistingDesktopSidecarsFn() {
        calls.push('stop-sidecars');
      },
      prepareNodeSidecarFn() {
        calls.push('prepare-node-sidecar');
      },
      prepareBackendRuntimeFn() {
        calls.push('prepare-backend-runtime');
      }
    });

    expect(calls).toEqual([
      'build-backend',
      'stop-sidecars',
      'prepare-node-sidecar',
      'prepare-backend-runtime'
    ]);
  });

  it('stops orchestration as soon as an earlier step fails', () => {
    const calls: string[] = [];

    expect(() =>
      main({
        buildBackendApplicationFn() {
          calls.push('build-backend');
          throw new Error('build failed');
        },
        stopExistingDesktopSidecarsFn() {
          calls.push('stop-sidecars');
        },
        prepareNodeSidecarFn() {
          calls.push('prepare-node-sidecar');
        },
        prepareBackendRuntimeFn() {
          calls.push('prepare-backend-runtime');
        }
      })
    ).toThrow('build failed');

    expect(calls).toEqual(['build-backend']);
  });

  it('does not continue when sidecar cleanup fails mid-sequence', () => {
    const calls: string[] = [];

    expect(() =>
      main({
        buildBackendApplicationFn() {
          calls.push('build-backend');
        },
        stopExistingDesktopSidecarsFn() {
          calls.push('stop-sidecars');
          throw new Error('cleanup failed');
        },
        prepareNodeSidecarFn() {
          calls.push('prepare-node-sidecar');
        },
        prepareBackendRuntimeFn() {
          calls.push('prepare-backend-runtime');
        }
      })
    ).toThrow('cleanup failed');

    expect(calls).toEqual(['build-backend', 'stop-sidecars']);
  });

  it('does not continue when node sidecar preparation fails', () => {
    const calls: string[] = [];

    expect(() =>
      main({
        buildBackendApplicationFn() {
          calls.push('build-backend');
        },
        stopExistingDesktopSidecarsFn() {
          calls.push('stop-sidecars');
        },
        prepareNodeSidecarFn() {
          calls.push('prepare-node-sidecar');
          throw new Error('copy failed');
        },
        prepareBackendRuntimeFn() {
          calls.push('prepare-backend-runtime');
        }
      })
    ).toThrow('copy failed');

    expect(calls).toEqual([
      'build-backend',
      'stop-sidecars',
      'prepare-node-sidecar'
    ]);
  });

  it('propagates backend runtime preparation failures from the final step', () => {
    const calls: string[] = [];

    expect(() =>
      main({
        buildBackendApplicationFn() {
          calls.push('build-backend');
        },
        stopExistingDesktopSidecarsFn() {
          calls.push('stop-sidecars');
        },
        prepareNodeSidecarFn() {
          calls.push('prepare-node-sidecar');
        },
        prepareBackendRuntimeFn() {
          calls.push('prepare-backend-runtime');
          throw new Error('install failed');
        }
      })
    ).toThrow('install failed');

    expect(calls).toEqual([
      'build-backend',
      'stop-sidecars',
      'prepare-node-sidecar',
      'prepare-backend-runtime'
    ]);
  });
});

describe('prepareNodeSidecar', () => {
  it('removes only stale node-* binaries before copying the active node sidecar', () => {
    const mkdirCalls: Array<{ path: string; recursive: boolean }> = [];
    const removedPaths: string[] = [];
    const copiedFiles: Array<{ from: string; to: string }> = [];

    const targetPath = prepareNodeSidecar({
      binariesDirectory: 'binaries-dir',
      copyFileSyncFn(from, to) {
        copiedFiles.push({ from, to });
      },
      mkdirSyncFn(path, options) {
        mkdirCalls.push({
          path,
          recursive: options?.recursive === true
        });
      },
      nodeExecPath: 'node.exe',
      platform: 'win32',
      readdirSyncFn() {
        return ['node-old.exe', 'keep.txt', 'node-stale'];
      },
      removePathFn(targetPath) {
        removedPaths.push(targetPath);
      },
      targetTripleFn() {
        return 'x86_64-pc-windows-msvc';
      }
    });

    expect(mkdirCalls).toEqual([{ path: 'binaries-dir', recursive: true }]);
    expect(removedPaths).toEqual([
      join('binaries-dir', 'node-old.exe'),
      join('binaries-dir', 'node-stale')
    ]);
    expect(copiedFiles).toEqual([
      {
        from: 'node.exe',
        to: join('binaries-dir', 'node-x86_64-pc-windows-msvc.exe')
      }
    ]);
    expect(targetPath).toBe(
      join('binaries-dir', 'node-x86_64-pc-windows-msvc.exe')
    );
  });

  it('uses extensionless sidecar names outside Windows', () => {
    const copiedFiles: Array<{ from: string; to: string }> = [];

    const targetPath = prepareNodeSidecar({
      binariesDirectory: 'binaries-dir',
      copyFileSyncFn(from, to) {
        copiedFiles.push({ from, to });
      },
      mkdirSyncFn() {
        return undefined;
      },
      nodeExecPath: '/usr/bin/node',
      platform: 'linux',
      readdirSyncFn() {
        return [];
      },
      removePathFn() {
        throw new Error('removePathFn must not be called');
      },
      targetTripleFn() {
        return 'aarch64-unknown-linux-gnu';
      }
    });

    expect(copiedFiles).toEqual([
      {
        from: '/usr/bin/node',
        to: join('binaries-dir', 'node-aarch64-unknown-linux-gnu')
      }
    ]);
    expect(targetPath).toBe(
      join('binaries-dir', 'node-aarch64-unknown-linux-gnu')
    );
  });

  it('ignores non-string readdir entries when pruning stale sidecars', () => {
    const copiedFiles: Array<{ from: string; to: string }> = [];
    const removedPaths: string[] = [];

    const targetPath = prepareNodeSidecar({
      binariesDirectory: 'binaries-dir',
      copyFileSyncFn(from, to) {
        copiedFiles.push({ from, to });
      },
      mkdirSyncFn() {
        return undefined;
      },
      nodeExecPath: 'node.exe',
      platform: 'win32',
      readdirSyncFn() {
        return [
          Buffer.from('node-buffer'),
          'node-old.exe',
          { name: 'node-dirent' }
        ] as unknown as ReturnType<typeof import('node:fs').readdirSync>;
      },
      removePathFn(targetPath) {
        removedPaths.push(targetPath);
      },
      targetTripleFn() {
        return 'x86_64-pc-windows-msvc';
      }
    });

    expect(removedPaths).toEqual([join('binaries-dir', 'node-old.exe')]);
    expect(copiedFiles).toEqual([
      {
        from: 'node.exe',
        to: join('binaries-dir', 'node-x86_64-pc-windows-msvc.exe')
      }
    ]);
    expect(targetPath).toBe(
      join('binaries-dir', 'node-x86_64-pc-windows-msvc.exe')
    );
  });

  it('replaces an existing target sidecar before copying the fresh binary', () => {
    const copiedFiles: Array<{ from: string; to: string }> = [];
    const removedPaths: string[] = [];

    const targetPath = prepareNodeSidecar({
      binariesDirectory: 'binaries-dir',
      copyFileSyncFn(from, to) {
        copiedFiles.push({ from, to });
      },
      mkdirSyncFn() {
        return undefined;
      },
      nodeExecPath: 'node.exe',
      platform: 'win32',
      readdirSyncFn() {
        return ['node-x86_64-pc-windows-msvc.exe'];
      },
      removePathFn(targetPath) {
        removedPaths.push(targetPath);
      },
      targetTripleFn() {
        return 'x86_64-pc-windows-msvc';
      }
    });

    expect(removedPaths).toEqual([
      join('binaries-dir', 'node-x86_64-pc-windows-msvc.exe')
    ]);
    expect(copiedFiles).toEqual([
      {
        from: 'node.exe',
        to: join('binaries-dir', 'node-x86_64-pc-windows-msvc.exe')
      }
    ]);
    expect(targetPath).toBe(
      join('binaries-dir', 'node-x86_64-pc-windows-msvc.exe')
    );
  });
});

describe('getRustTargetTriple', () => {
  it('prefers rustc --print host-tuple when it succeeds', () => {
    const calls: Array<{
      args: string[];
      command: string;
      cwd: string | undefined;
    }> = [];
    const triple = getRustTargetTriple({
      cwd: 'workspace-root',
      spawnSyncFn(command, args, options) {
        calls.push({
          args,
          command,
          cwd:
            typeof options === 'object' ? options?.cwd?.toString() : undefined
        });
        return {
          error: undefined,
          status: 0,
          stdout: 'x86_64-pc-windows-msvc\n'
        } as ReturnType<typeof import('node:child_process').spawnSync>;
      }
    });

    expect(triple).toBe('x86_64-pc-windows-msvc');
    expect(calls).toEqual([
      {
        args: ['--print', 'host-tuple'],
        command: 'rustc',
        cwd: 'workspace-root'
      }
    ]);
  });

  it('uses rootDir as the rustc working directory when cwd is omitted', () => {
    const calls: Array<{
      args: string[];
      command: string;
      cwd: string | undefined;
    }> = [];

    const triple = getRustTargetTriple({
      rootDir: 'workspace-root',
      spawnSyncFn(command, args, options) {
        calls.push({
          args,
          command,
          cwd:
            typeof options === 'object' ? options?.cwd?.toString() : undefined
        });
        return {
          error: undefined,
          status: 0,
          stdout: 'x86_64-pc-windows-msvc\n'
        } as ReturnType<typeof import('node:child_process').spawnSync>;
      }
    });

    expect(triple).toBe('x86_64-pc-windows-msvc');
    expect(calls[0]).toEqual({
      args: ['--print', 'host-tuple'],
      command: 'rustc',
      cwd: 'workspace-root'
    });
  });

  it('falls back to parsing rustc -vV output when host-tuple is unavailable', () => {
    let callCount = 0;
    const calls: Array<{
      args: string[];
      command: string;
      cwd: string | undefined;
    }> = [];

    const triple = getRustTargetTriple({
      cwd: 'workspace-root',
      spawnSyncFn(command, args, options) {
        callCount += 1;
        calls.push({
          args,
          command,
          cwd:
            typeof options === 'object' ? options?.cwd?.toString() : undefined
        });
        if (callCount === 1) {
          return {
            error: new Error('missing'),
            status: null,
            stdout: '',
            stderr: 'missing'
          } as ReturnType<typeof import('node:child_process').spawnSync>;
        }

        return {
          error: undefined,
          status: 0,
          stdout: 'release: 1.0.0\nhost: aarch64-apple-darwin\n'
        } as ReturnType<typeof import('node:child_process').spawnSync>;
      }
    });

    expect(triple).toBe('aarch64-apple-darwin');
    expect(calls).toEqual([
      {
        args: ['--print', 'host-tuple'],
        command: 'rustc',
        cwd: 'workspace-root'
      },
      {
        args: ['-vV'],
        command: 'rustc',
        cwd: 'workspace-root'
      }
    ]);
  });

  it('falls back to rustc -vV when host-tuple exits non-zero without an error object', () => {
    let callCount = 0;

    const triple = getRustTargetTriple({
      cwd: 'workspace-root',
      spawnSyncFn() {
        callCount += 1;
        if (callCount === 1) {
          return {
            error: undefined,
            status: 1,
            stdout: '',
            stderr: ''
          } as ReturnType<typeof import('node:child_process').spawnSync>;
        }

        return {
          error: undefined,
          status: 0,
          stdout: 'release: 1.0.0\nhost: aarch64-apple-darwin\n'
        } as ReturnType<typeof import('node:child_process').spawnSync>;
      }
    });

    expect(triple).toBe('aarch64-apple-darwin');
  });

  it('throws when the fallback rustc -vV output lacks a host tuple', () => {
    let callCount = 0;
    const calls: Array<{
      args: string[];
      command: string;
      cwd: string | undefined;
    }> = [];

    expect(() =>
      getRustTargetTriple({
        cwd: 'workspace-root',
        spawnSyncFn(command, args, options) {
          callCount += 1;
          calls.push({
            args,
            command,
            cwd:
              typeof options === 'object' ? options?.cwd?.toString() : undefined
          });
          if (callCount === 1) {
            return {
              error: new Error('missing'),
              status: null,
              stdout: '',
              stderr: 'missing'
            } as ReturnType<typeof import('node:child_process').spawnSync>;
          }

          return {
            error: undefined,
            status: 0,
            stdout: 'release: 1.0.0\n'
          } as ReturnType<typeof import('node:child_process').spawnSync>;
        }
      })
    ).toThrow('Unable to parse the Rust target triple');

    expect(calls).toEqual([
      {
        args: ['--print', 'host-tuple'],
        command: 'rustc',
        cwd: 'workspace-root'
      },
      {
        args: ['-vV'],
        command: 'rustc',
        cwd: 'workspace-root'
      }
    ]);
  });

  it('throws the rustc fallback stderr when both rust target probes fail', () => {
    let callCount = 0;

    expect(() =>
      getRustTargetTriple({
        cwd: 'workspace-root',
        spawnSyncFn() {
          callCount += 1;
          if (callCount === 1) {
            return {
              error: new Error('missing'),
              status: null,
              stdout: '',
              stderr: 'missing'
            } as ReturnType<typeof import('node:child_process').spawnSync>;
          }

          return {
            error: undefined,
            status: 1,
            stdout: '',
            stderr: 'rustc not found'
          } as ReturnType<typeof import('node:child_process').spawnSync>;
        }
      })
    ).toThrow('rustc not found');
  });

  it('uses the default rust target error message when rustc fails without stderr', () => {
    let callCount = 0;

    expect(() =>
      getRustTargetTriple({
        cwd: 'workspace-root',
        spawnSyncFn() {
          callCount += 1;
          if (callCount === 1) {
            return {
              error: new Error('missing'),
              status: null,
              stdout: '',
              stderr: 'missing'
            } as ReturnType<typeof import('node:child_process').spawnSync>;
          }

          return {
            error: undefined,
            status: 1,
            stdout: '',
            stderr: ''
          } as ReturnType<typeof import('node:child_process').spawnSync>;
        }
      })
    ).toThrow('Failed to determine the Rust target triple');
  });

  it('falls back when rustc host-tuple succeeds with empty stdout', () => {
    let callCount = 0;

    const triple = getRustTargetTriple({
      cwd: 'workspace-root',
      spawnSyncFn() {
        callCount += 1;
        if (callCount === 1) {
          return {
            error: undefined,
            status: 0,
            stdout: ''
          } as ReturnType<typeof import('node:child_process').spawnSync>;
        }

        return {
          error: undefined,
          status: 0,
          stdout: 'release: 1.0.0\nhost: x86_64-unknown-linux-gnu\n'
        } as ReturnType<typeof import('node:child_process').spawnSync>;
      }
    });

    expect(triple).toBe('x86_64-unknown-linux-gnu');
  });
});

describe('stopExistingDesktopSidecars', () => {
  it('documents the target-sidecar locations used by Tauri runtime cleanup', () => {
    expect(getDefaultDesktopNodePaths('workspace-root')).toEqual([
      join(
        'workspace-root',
        'apps',
        'desktop-tauri',
        'src-tauri',
        'target',
        'debug',
        'node.exe'
      ),
      join(
        'workspace-root',
        'apps',
        'desktop-tauri',
        'src-tauri',
        'target',
        'release',
        'node.exe'
      )
    ]);
  });

  it('escapes single quotes in PowerShell path literals', () => {
    expect(
      buildStopExistingDesktopSidecarsScript(["C:\\Users\\O'Brien\\node.exe"])
    ).toContain("'C:\\Users\\O''Brien\\node.exe'");
  });

  it('builds the expected PowerShell cleanup pipeline even with no paths', () => {
    const script = buildStopExistingDesktopSidecarsScript([]);

    expect(script).toContain('$paths = @()');
    expect(script).toContain('Get-CimInstance Win32_Process');
    expect(script).toContain('$_.ExecutablePath');
    expect(script).toContain('$paths -contains');
    expect(script).toContain('Stop-Process -Id $_.ProcessId -Force');
  });

  it('is a no-op outside Windows', () => {
    const calls: string[] = [];

    const didRun = stopExistingDesktopSidecars({
      platform: 'linux',
      runBestEffortFn() {
        calls.push('called');
      }
    });

    expect(didRun).toBe(false);
    expect(calls).toEqual([]);
  });

  it('invokes the Windows cleanup script only on Windows', () => {
    const calls: Array<{ command: string; args: string[]; cwd: string }> = [];

    const didRun = stopExistingDesktopSidecars({
      desktopNodePaths: ['debug-node.exe', 'release-node.exe'],
      platform: 'win32',
      rootDir: 'workspace-root',
      runBestEffortFn(command, args, cwd) {
        calls.push({ command, args, cwd });
      }
    });

    expect(didRun).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      command: 'powershell.exe',
      cwd: 'workspace-root'
    });
    expect(calls[0]?.args).toEqual(
      expect.arrayContaining(['-NoProfile', '-Command'])
    );
    expect(calls[0]?.args[2]).toContain("'debug-node.exe'");
    expect(calls[0]?.args[2]).toContain("'release-node.exe'");
  });

  it('uses the default Tauri target node paths when none are provided', () => {
    const calls: Array<{ command: string; args: string[]; cwd: string }> = [];

    const didRun = stopExistingDesktopSidecars({
      platform: 'win32',
      rootDir: 'workspace-root',
      runBestEffortFn(command, args, cwd) {
        calls.push({ command, args, cwd });
      }
    });

    expect(didRun).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.args[2]).toContain(
      join(
        'workspace-root',
        'apps',
        'desktop-tauri',
        'src-tauri',
        'target',
        'debug',
        'node.exe'
      )
    );
    expect(calls[0]?.args[2]).toContain(
      join(
        'workspace-root',
        'apps',
        'desktop-tauri',
        'src-tauri',
        'target',
        'release',
        'node.exe'
      )
    );
  });
});
