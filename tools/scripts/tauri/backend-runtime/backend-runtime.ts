import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  backendDistDir,
  resolveNpmEntrypoint,
  resolveNxEntrypoint,
  workspaceRoot
} from '../path-contract/path-contract.ts';
import {
  rmIfExists,
  run,
  type RemovePathFunction,
  type RunFunction,
  tryRun,
  type TryRunFunction
} from '../process-utils/process-utils.ts';

export interface BackendRuntimeInstallPlan {
  fallbackCommand: 'install' | null;
  removeLockfileBeforeFallback: boolean;
  primaryCommand: 'ci' | 'install';
}

export interface BackendRuntimeInstallStamp {
  arch: string;
  nodeVersion: string;
  packageJsonHash: string;
  packageLockHash: string | null;
  platform: NodeJS.Platform;
  version: 1;
}

export type HashFileFunction = (targetPath: string) => string;
export type ReadTextFileFunction = (
  targetPath: string,
  encoding: BufferEncoding
) => string;
export type WriteTextFileFunction = (
  targetPath: string,
  content: string,
  encoding: BufferEncoding
) => void;

export interface PrepareBackendRuntimeDependencies {
  arch?: string;
  backendDir?: string;
  existsSyncFn?: typeof existsSync;
  hashFileFn?: HashFileFunction;
  nodeExecPath?: string;
  nodeVersion?: string;
  platform?: NodeJS.Platform;
  readFileSyncFn?: ReadTextFileFunction;
  removePathFn?: RemovePathFunction;
  runFn?: RunFunction;
  tryRunFn?: TryRunFunction;
  warnFn?: typeof console.warn;
  writeFileSyncFn?: WriteTextFileFunction;
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

export function hashFile(targetPath: string) {
  return createHash('sha256').update(readFileSync(targetPath)).digest('hex');
}

export function getBackendRuntimeStampPath(backendDir: string) {
  return join(backendDir, '.install-stamp.json');
}

export function buildBackendRuntimeInstallStamp(
  backendDir: string,
  dependencies: {
    arch?: string;
    existsSyncFn?: typeof existsSync;
    hashFileFn?: HashFileFunction;
    nodeVersion?: string;
    platform?: NodeJS.Platform;
  } = {}
): BackendRuntimeInstallStamp {
  const existsSyncFn = dependencies.existsSyncFn ?? existsSync;
  const hashFileFn = dependencies.hashFileFn ?? hashFile;
  const packageJsonPath = join(backendDir, 'package.json');
  const packageLockPath = join(backendDir, 'package-lock.json');

  return {
    arch: dependencies.arch ?? process.arch,
    nodeVersion: dependencies.nodeVersion ?? process.version,
    packageJsonHash: hashFileFn(packageJsonPath),
    packageLockHash: existsSyncFn(packageLockPath)
      ? hashFileFn(packageLockPath)
      : null,
    platform: dependencies.platform ?? process.platform,
    version: 1
  };
}

function isBackendRuntimeInstallStamp(
  candidate: unknown
): candidate is BackendRuntimeInstallStamp {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const stamp = candidate as Partial<BackendRuntimeInstallStamp>;

  return (
    stamp.version === 1 &&
    typeof stamp.arch === 'string' &&
    typeof stamp.nodeVersion === 'string' &&
    typeof stamp.packageJsonHash === 'string' &&
    (typeof stamp.packageLockHash === 'string' ||
      stamp.packageLockHash === null) &&
    typeof stamp.platform === 'string'
  );
}

function readBackendRuntimeInstallStamp(
  stampPath: string,
  readFileSyncFn: ReadTextFileFunction
): BackendRuntimeInstallStamp | null {
  try {
    const parsed = JSON.parse(readFileSyncFn(stampPath, 'utf8')) as unknown;

    return isBackendRuntimeInstallStamp(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function areBackendRuntimeInstallStampsEqual(
  left: BackendRuntimeInstallStamp,
  right: BackendRuntimeInstallStamp
) {
  return (
    left.version === right.version &&
    left.arch === right.arch &&
    left.nodeVersion === right.nodeVersion &&
    left.packageJsonHash === right.packageJsonHash &&
    left.packageLockHash === right.packageLockHash &&
    left.platform === right.platform
  );
}

function writeBackendRuntimeInstallStamp(
  stampPath: string,
  stamp: BackendRuntimeInstallStamp,
  dependencies: {
    warnFn: typeof console.warn;
    writeFileSyncFn: WriteTextFileFunction;
  }
) {
  try {
    dependencies.writeFileSyncFn(
      stampPath,
      `${JSON.stringify(stamp, null, 2)}\n`,
      'utf8'
    );
  } catch (error) {
    dependencies.warnFn(
      `Backend runtime install succeeded, but writing ${stampPath} failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export function buildBackendApplication(
  dependencies: BuildBackendApplicationDependencies = {}
) {
  const nodeExecPath = dependencies.nodeExecPath ?? process.execPath;
  const rootDir = dependencies.rootDir ?? workspaceRoot;
  const runFn = dependencies.runFn ?? run;

  runFn(
    nodeExecPath,
    [resolveNxEntrypoint(rootDir), 'build', 'nest-backend'],
    rootDir
  );
}

export function prepareBackendRuntime(
  dependencies: PrepareBackendRuntimeDependencies = {}
) {
  const backendDir = dependencies.backendDir ?? backendDistDir;
  const arch = dependencies.arch ?? process.arch;
  const existsSyncFn = dependencies.existsSyncFn ?? existsSync;
  const hashFileFn = dependencies.hashFileFn ?? hashFile;
  const nodeExecPath = dependencies.nodeExecPath ?? process.execPath;
  const nodeVersion = dependencies.nodeVersion ?? process.version;
  const platform = dependencies.platform ?? process.platform;
  const readFileSyncFn =
    dependencies.readFileSyncFn ??
    ((targetPath, encoding) => readFileSync(targetPath, encoding));
  const removePathFn = dependencies.removePathFn ?? rmIfExists;
  const runFn = dependencies.runFn ?? run;
  const tryRunFn = dependencies.tryRunFn ?? tryRun;
  const warnFn = dependencies.warnFn ?? console.warn;
  const writeFileSyncFn =
    dependencies.writeFileSyncFn ??
    ((targetPath, content, encoding) =>
      writeFileSync(targetPath, content, encoding));

  if (!existsSyncFn(join(backendDir, 'package.json'))) {
    throw new Error(`Missing generated backend package.json in ${backendDir}`);
  }

  const packageLockPath = join(backendDir, 'package-lock.json');
  const nodeModulesPath = join(backendDir, 'node_modules');
  const stampPath = getBackendRuntimeStampPath(backendDir);
  const expectedStamp = buildBackendRuntimeInstallStamp(backendDir, {
    existsSyncFn,
    hashFileFn,
    nodeVersion,
    platform,
    arch
  });

  if (existsSyncFn(nodeModulesPath) && existsSyncFn(stampPath)) {
    const installedStamp = readBackendRuntimeInstallStamp(
      stampPath,
      readFileSyncFn
    );

    if (
      installedStamp &&
      areBackendRuntimeInstallStampsEqual(installedStamp, expectedStamp)
    ) {
      return;
    }
  }

  removePathFn(nodeModulesPath);
  const installPlan = getBackendRuntimeInstallPlan(
    existsSyncFn(packageLockPath)
  );
  const primaryArgs = [
    resolveNpmEntrypoint(nodeExecPath),
    installPlan.primaryCommand,
    '--omit=dev',
    '--no-audit',
    '--no-fund'
  ];

  if (tryRunFn(nodeExecPath, primaryArgs, backendDir)) {
    writeBackendRuntimeInstallStamp(
      stampPath,
      buildBackendRuntimeInstallStamp(backendDir, {
        existsSyncFn,
        hashFileFn,
        nodeVersion,
        platform,
        arch
      }),
      { warnFn, writeFileSyncFn }
    );
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
    [
      resolveNpmEntrypoint(nodeExecPath),
      installPlan.fallbackCommand,
      '--omit=dev',
      '--no-audit',
      '--no-fund'
    ],
    backendDir
  );
  writeBackendRuntimeInstallStamp(
    stampPath,
    buildBackendRuntimeInstallStamp(backendDir, {
      existsSyncFn,
      hashFileFn,
      nodeVersion,
      platform,
      arch
    }),
    { warnFn, writeFileSyncFn }
  );
}
