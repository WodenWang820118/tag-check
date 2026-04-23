import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  backendDistDir,
  resolveNpmEntrypoint,
  resolveNxEntrypoint,
  workspaceRoot
} from './path-contract.ts';
import {
  rmIfExists,
  run,
  type RemovePathFunction,
  type RunFunction,
  tryRun,
  type TryRunFunction
} from './process-utils.ts';

export interface BackendRuntimeInstallPlan {
  fallbackCommand: 'install' | null;
  removeLockfileBeforeFallback: boolean;
  primaryCommand: 'ci' | 'install';
}

export interface PrepareBackendRuntimeDependencies {
  backendDir?: string;
  existsSyncFn?: typeof existsSync;
  nodeExecPath?: string;
  removePathFn?: RemovePathFunction;
  runFn?: RunFunction;
  tryRunFn?: TryRunFunction;
  warnFn?: typeof console.warn;
}

export interface BuildBackendApplicationDependencies {
  nodeExecPath?: string;
  rootDir?: string;
  runFn?: RunFunction;
}

export function getBackendRuntimeInstallPlan(
  hasPackageLock: boolean
): BackendRuntimeInstallPlan {
  if (hasPackageLock) {
    return {
      fallbackCommand: 'install',
      primaryCommand: 'ci',
      removeLockfileBeforeFallback: true
    };
  }

  return {
    fallbackCommand: null,
    primaryCommand: 'install',
    removeLockfileBeforeFallback: false
  };
}

export function buildBackendApplication(
  dependencies: BuildBackendApplicationDependencies = {}
) {
  const nodeExecPath = dependencies.nodeExecPath ?? process.execPath;
  const rootDir = dependencies.rootDir ?? workspaceRoot;
  const runFn = dependencies.runFn ?? run;

  runFn(nodeExecPath, [resolveNxEntrypoint(rootDir), 'build', 'nest-backend'], rootDir);
}

export function prepareBackendRuntime(
  dependencies: PrepareBackendRuntimeDependencies = {}
) {
  const backendDir = dependencies.backendDir ?? backendDistDir;
  const existsSyncFn = dependencies.existsSyncFn ?? existsSync;
  const nodeExecPath = dependencies.nodeExecPath ?? process.execPath;
  const removePathFn = dependencies.removePathFn ?? rmIfExists;
  const runFn = dependencies.runFn ?? run;
  const tryRunFn = dependencies.tryRunFn ?? tryRun;
  const warnFn = dependencies.warnFn ?? console.warn;

  if (!existsSyncFn(join(backendDir, 'package.json'))) {
    throw new Error(`Missing generated backend package.json in ${backendDir}`);
  }

  const packageLockPath = join(backendDir, 'package-lock.json');
  removePathFn(join(backendDir, 'node_modules'));
  const installPlan = getBackendRuntimeInstallPlan(existsSyncFn(packageLockPath));
  const primaryArgs = [
    resolveNpmEntrypoint(nodeExecPath),
    installPlan.primaryCommand,
    '--omit=dev'
  ];

  if (tryRunFn(nodeExecPath, primaryArgs, backendDir)) {
    return;
  }

  if (!installPlan.fallbackCommand) {
    throw new Error(`Command failed: ${nodeExecPath} ${primaryArgs.join(' ')}`);
  }

  removePathFn(join(backendDir, 'node_modules'));
  if (installPlan.removeLockfileBeforeFallback) {
    removePathFn(packageLockPath);
  }

  warnFn(
    `npm ci failed in ${backendDir}. Falling back to npm install to regenerate runtime dependencies.`
  );
  runFn(
    nodeExecPath,
    [resolveNpmEntrypoint(nodeExecPath), installPlan.fallbackCommand, '--omit=dev'],
    backendDir
  );
}
