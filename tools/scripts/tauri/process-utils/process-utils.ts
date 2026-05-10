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
  cwd: string,
  shell?: boolean
) => void;
export type TryRunFunction = (
  command: string,
  args: string[],
  cwd: string,
  shell?: boolean
) => boolean;

export function rmIfExists(targetPath: string) {
  if (existsSync(targetPath)) {
    rmSync(targetPath, { force: true, recursive: true });
  }
}

export function run(
  command: string,
  args: string[],
  cwd: string,
  shell = false
) {
  runSyncCommandOrThrow({
    command,
    args,
    cwd,
    shell,
    stdio: 'inherit'
  });
}

export function tryRun(
  command: string,
  args: string[],
  cwd: string,
  shell = false
) {
  return tryRunSyncCommand({
    command,
    args,
    cwd,
    shell,
    stdio: 'inherit'
  });
}

export function runBestEffort(
  command: string,
  args: string[],
  cwd: string,
  shell = false
) {
  runBestEffortSyncCommand({
    command,
    args,
    cwd,
    shell,
    stdio: 'ignore'
  });
}
