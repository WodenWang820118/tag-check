import {
  spawnSync,
  type SpawnSyncOptionsWithStringEncoding,
  type SpawnSyncReturns
} from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

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

export function resolveWindowsPowerShellPath(): string | null {
  if (process.platform !== 'win32') {
    return null;
  }

  const candidates = [
    'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    'C:\\Program Files\\PowerShell\\7\\pwsh.exe'
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

export function resolveWindowsScriptPath(scriptName: string): string | null {
  if (process.platform !== 'win32') {
    return null;
  }

  const candidates = [
    process.env.APPDATA ? join(process.env.APPDATA, 'npm', scriptName) : null,
    process.env.NVM_SYMLINK ? join(process.env.NVM_SYMLINK, scriptName) : null
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  const whereResult = spawnSync('where.exe', [scriptName], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (whereResult.error || whereResult.status !== 0) {
    return null;
  }

  return (
    whereResult.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0 && existsSync(line)) ?? null
  );
}
