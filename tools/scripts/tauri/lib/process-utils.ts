import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';

export type RemovePathFunction = (targetPath: string) => void;
export type RunFunction = (command: string, args: string[], cwd: string) => void;
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
  if (!tryRun(command, args, cwd)) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

export function tryRun(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    shell: false,
    stdio: 'inherit'
  });

  return !result.error && result.status === 0;
}

export function runBestEffort(command: string, args: string[], cwd: string) {
  spawnSync(command, args, {
    cwd,
    shell: false,
    stdio: 'ignore'
  });
}
