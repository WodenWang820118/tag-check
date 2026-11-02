import { spawnSync, type SpawnSyncReturns } from 'node:child_process';

import {
  resolveWindowsPowerShellPath,
  resolveWindowsScriptPath
} from '../../../shared/process.ts';

export interface LocalCliCommandInput {
  args: string[];
  command: string;
  cwd?: string;
  input?: string;
  timeoutMs?: number;
  windowsScriptName?: string;
}

export interface LocalCliCommandResult {
  error?: Error;
  signal?: NodeJS.Signals | null;
  status: number | null;
  stderr: string;
  stdout: string;
}

export function runLocalCliCommand(
  input: LocalCliCommandInput
): LocalCliCommandResult {
  const options = {
    cwd: input.cwd,
    encoding: 'utf8' as const,
    input: input.input,
    stdio: ['pipe', 'pipe', 'pipe'] as ['pipe', 'pipe', 'pipe'],
    timeout: input.timeoutMs
  };

  if (process.platform === 'win32' && input.windowsScriptName) {
    const scriptPath = resolveWindowsScriptPath(input.windowsScriptName);
    const powershellPath = resolveWindowsPowerShellPath();

    if (scriptPath && powershellPath) {
      return normalizeSpawnResult(
        spawnSync(
          powershellPath,
          [
            '-NoProfile',
            '-NonInteractive',
            '-ExecutionPolicy',
            'Bypass',
            '-File',
            scriptPath,
            ...input.args
          ],
          options
        )
      );
    }
  }

  return normalizeSpawnResult(spawnSync(input.command, input.args, options));
}

function normalizeSpawnResult(
  result: SpawnSyncReturns<string>
): LocalCliCommandResult {
  return {
    error: result.error ? (result.error as Error) : undefined,
    signal: result.signal,
    status: result.status,
    stderr: result.stderr ?? '',
    stdout: result.stdout ?? ''
  };
}
