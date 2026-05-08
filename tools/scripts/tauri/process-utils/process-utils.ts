import { existsSync, rmSync } from 'node:fs';

import {
  runBestEffortSyncCommand,
  runSyncCommandOrThrow,
  tryRunSyncCommand
} from '../../shared/process.ts';

export type RemovePathFunction = (targetPath: string) => void;
export type RunFunction = (
  command: string,
  args: string[],
  cwd: string
) => void;
export type TryRunFunction = (
  command: string,
  args: string[],
  cwd: string
) => boolean;

export function rmIfExists(targetPath: string) {
  if (existsSync(targetPath)) {
    rmSync(targetPath, { force: true, recursive: true });
  }
}

export function run(command: string, args: string[], cwd: string) {
  runSyncCommandOrThrow({
    command,
    args,
    cwd,
    stdio: 'inherit'
  });
}

export function tryRun(command: string, args: string[], cwd: string) {
  return tryRunSyncCommand({
    command,
    args,
    cwd,
    stdio: 'inherit'
  });
}

export function runBestEffort(command: string, args: string[], cwd: string) {
  runBestEffortSyncCommand({
    command,
    args,
    cwd,
    stdio: 'ignore'
  });
}
