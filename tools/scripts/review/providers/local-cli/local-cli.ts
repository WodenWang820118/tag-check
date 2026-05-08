import {
  spawnSync,
  type SpawnSyncOptionsWithStringEncoding,
  type SpawnSyncReturns
} from 'node:child_process';

import {
  resolveWindowsPowerShellPath,
  resolveWindowsScriptPath
} from '../../../shared/process.ts';

interface LocalCliCommandInput {
  args: string[];
  command: string;
  cwd?: string;
  input?: string;
  timeoutMs?: number;
  windowsScriptName?: string;
}

export function runLocalCliCommand(
  input: LocalCliCommandInput
): SpawnSyncReturns<string> {
  const options: SpawnSyncOptionsWithStringEncoding = {
    cwd: input.cwd,
    encoding: 'utf8',
    input: input.input,
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: input.timeoutMs
  };

  if (process.platform === 'win32' && input.windowsScriptName) {
    const scriptPath = resolveWindowsScriptPath(input.windowsScriptName);
    const powershellPath = resolveWindowsPowerShellPath();

    if (scriptPath && powershellPath) {
      return spawnSync(
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
      );
    }
  }

  return spawnSync(input.command, input.args, options);
}

export {
  resolveWindowsPowerShellPath,
  resolveWindowsScriptPath
} from '../../../shared/process.ts';
