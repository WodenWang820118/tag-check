import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  readdirSync
} from 'node:fs';
import { join } from 'node:path';

import { binariesDir, workspaceRoot } from './path-contract.ts';
import { rmIfExists, type RemovePathFunction } from './process-utils.ts';

export interface RustTargetTripleDependencies {
  cwd?: string;
  rootDir?: string;
  spawnSyncFn?: typeof spawnSync;
}

export interface PrepareNodeSidecarDependencies {
  binariesDirectory?: string;
  copyFileSyncFn?: typeof copyFileSync;
  mkdirSyncFn?: typeof mkdirSync;
  nodeExecPath?: string;
  platform?: NodeJS.Platform;
  readdirSyncFn?: typeof readdirSync;
  removePathFn?: RemovePathFunction;
  targetTripleFn?: () => string;
}

export function getRustTargetTriple(
  dependencies: RustTargetTripleDependencies = {}
) {
  const rootDir = dependencies.rootDir ?? workspaceRoot;
  const cwd = dependencies.cwd ?? rootDir;
  const spawnSyncFn = dependencies.spawnSyncFn ?? spawnSync;
  const preferred = spawnSyncFn('rustc', ['--print', 'host-tuple'], {
    cwd,
    encoding: 'utf8'
  });

  if (!preferred.error && preferred.status === 0 && preferred.stdout) {
    return preferred.stdout.trim();
  }

  const fallback = spawnSyncFn('rustc', ['-vV'], {
    cwd,
    encoding: 'utf8'
  });

  if (fallback.status !== 0) {
    throw new Error(
      fallback.stderr || 'Failed to determine the Rust target triple'
    );
  }

  const match = fallback.stdout?.match(/^host:\s+(\S+)$/m);
  if (!match) {
    throw new Error('Unable to parse the Rust target triple from `rustc -vV`.');
  }

  return match[1];
}

export function prepareNodeSidecar(
  dependencies: PrepareNodeSidecarDependencies = {}
) {
  const binariesDirectory = dependencies.binariesDirectory ?? binariesDir;
  const copyFileSyncFn = dependencies.copyFileSyncFn ?? copyFileSync;
  const mkdirSyncFn = dependencies.mkdirSyncFn ?? mkdirSync;
  const nodeExecPath = dependencies.nodeExecPath ?? process.execPath;
  const platform = dependencies.platform ?? process.platform;
  const readdirSyncFn = dependencies.readdirSyncFn ?? readdirSync;
  const removePathFn = dependencies.removePathFn ?? rmIfExists;
  const targetTriple =
    dependencies.targetTripleFn?.() ?? getRustTargetTriple();
  const extension = platform === 'win32' ? '.exe' : '';
  const targetPath = join(binariesDirectory, `node-${targetTriple}${extension}`);

  mkdirSyncFn(binariesDirectory, { recursive: true });

  for (const fileName of readdirSyncFn(binariesDirectory)) {
    if (typeof fileName === 'string' && fileName.startsWith('node-')) {
      removePathFn(join(binariesDirectory, fileName));
    }
  }

  copyFileSyncFn(nodeExecPath, targetPath);
  return targetPath;
}
