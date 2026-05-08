import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { basename, join } from 'node:path';

import { binariesDir, workspaceRoot } from '../path-contract/path-contract.ts';
import {
  rmIfExists,
  type RemovePathFunction
} from '../process-utils/process-utils.ts';

export interface RustTargetTripleDependencies {
  cwd?: string;
  rootDir?: string;
  spawnSyncFn?: typeof spawnSync;
}

export interface PrepareNodeSidecarDependencies {
  binariesDirectory?: string;
  copyFileSyncFn?: typeof copyFileSync;
  existsSyncFn?: typeof existsSync;
  mkdirSyncFn?: typeof mkdirSync;
  nodeExecPath?: string;
  platform?: NodeJS.Platform;
  readdirSyncFn?: typeof readdirSync;
  readFileSyncFn?: ReadTextFileFunction;
  removePathFn?: RemovePathFunction;
  statSyncFn?: StatFileFunction;
  targetTripleFn?: () => string;
  warnFn?: typeof console.warn;
  writeFileSyncFn?: WriteTextFileFunction;
}

interface NodeSidecarStamp {
  sourceMtimeMs: number;
  sourcePath: string;
  sourceSize: number;
  targetFileName: string;
  version: 1;
}

type ReadTextFileFunction = (
  targetPath: string,
  encoding: BufferEncoding
) => string;
type WriteTextFileFunction = (
  targetPath: string,
  content: string,
  encoding: BufferEncoding
) => void;
type StatFileFunction = (targetPath: string) => {
  mtimeMs: number;
  size: number;
};

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

export function getNodeSidecarStampPath(binariesDirectory: string) {
  return join(binariesDirectory, '.node-sidecar-stamp.json');
}

function buildNodeSidecarStamp(
  sourcePath: string,
  targetPath: string,
  statSyncFn: StatFileFunction
): NodeSidecarStamp {
  const sourceStat = statSyncFn(sourcePath);

  return {
    sourceMtimeMs: sourceStat.mtimeMs,
    sourcePath,
    sourceSize: sourceStat.size,
    targetFileName: basename(targetPath),
    version: 1
  };
}

function isNodeSidecarStamp(candidate: unknown): candidate is NodeSidecarStamp {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  const stamp = candidate as Partial<NodeSidecarStamp>;

  return (
    stamp.version === 1 &&
    typeof stamp.sourceMtimeMs === 'number' &&
    typeof stamp.sourcePath === 'string' &&
    typeof stamp.sourceSize === 'number' &&
    typeof stamp.targetFileName === 'string'
  );
}

function readNodeSidecarStamp(
  stampPath: string,
  readFileSyncFn: ReadTextFileFunction
): NodeSidecarStamp | null {
  try {
    const parsed = JSON.parse(readFileSyncFn(stampPath, 'utf8')) as unknown;

    return isNodeSidecarStamp(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function areNodeSidecarStampsEqual(
  left: NodeSidecarStamp,
  right: NodeSidecarStamp
) {
  return (
    left.version === right.version &&
    left.sourceMtimeMs === right.sourceMtimeMs &&
    left.sourcePath === right.sourcePath &&
    left.sourceSize === right.sourceSize &&
    left.targetFileName === right.targetFileName
  );
}

function writeNodeSidecarStamp(
  stampPath: string,
  stamp: NodeSidecarStamp,
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
      `Node sidecar was copied, but writing ${stampPath} failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export function prepareNodeSidecar(
  dependencies: PrepareNodeSidecarDependencies = {}
) {
  const binariesDirectory = dependencies.binariesDirectory ?? binariesDir;
  const copyFileSyncFn = dependencies.copyFileSyncFn ?? copyFileSync;
  const existsSyncFn = dependencies.existsSyncFn ?? existsSync;
  const mkdirSyncFn = dependencies.mkdirSyncFn ?? mkdirSync;
  const nodeExecPath = dependencies.nodeExecPath ?? process.execPath;
  const platform = dependencies.platform ?? process.platform;
  const readdirSyncFn = dependencies.readdirSyncFn ?? readdirSync;
  const readFileSyncFn =
    dependencies.readFileSyncFn ??
    ((targetPath, encoding) => readFileSync(targetPath, encoding));
  const removePathFn = dependencies.removePathFn ?? rmIfExists;
  const statSyncFn = dependencies.statSyncFn ?? statSync;
  const targetTriple = dependencies.targetTripleFn?.() ?? getRustTargetTriple();
  const warnFn = dependencies.warnFn ?? console.warn;
  const writeFileSyncFn =
    dependencies.writeFileSyncFn ??
    ((targetPath, content, encoding) =>
      writeFileSync(targetPath, content, encoding));
  const extension = platform === 'win32' ? '.exe' : '';
  const targetPath = join(
    binariesDirectory,
    `node-${targetTriple}${extension}`
  );
  const stampPath = getNodeSidecarStampPath(binariesDirectory);
  const expectedStamp = buildNodeSidecarStamp(
    nodeExecPath,
    targetPath,
    statSyncFn
  );

  mkdirSyncFn(binariesDirectory, { recursive: true });

  for (const fileName of readdirSyncFn(binariesDirectory)) {
    if (
      typeof fileName === 'string' &&
      fileName.startsWith('node-') &&
      fileName !== basename(targetPath)
    ) {
      removePathFn(join(binariesDirectory, fileName));
    }
  }

  if (existsSyncFn(targetPath) && existsSyncFn(stampPath)) {
    const existingStamp = readNodeSidecarStamp(stampPath, readFileSyncFn);

    if (
      existingStamp &&
      areNodeSidecarStampsEqual(existingStamp, expectedStamp)
    ) {
      return targetPath;
    }
  }

  copyFileSyncFn(nodeExecPath, targetPath);
  writeNodeSidecarStamp(stampPath, expectedStamp, { warnFn, writeFileSyncFn });
  return targetPath;
}
