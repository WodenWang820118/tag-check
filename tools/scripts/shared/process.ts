import {
  spawnSync,
  type SpawnSyncOptionsWithStringEncoding
} from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface CommandResult {
  error?: Error;
  status: number | null;
  stderr: string;
  stdout: string;
}

export interface SyncCommandRunnerInput {
  args: string[];
  command: string;
  cwd: string;
  env?: NodeJS.ProcessEnv;
  input?: string;
  shell?: boolean;
  stdio?: SpawnSyncOptionsWithStringEncoding['stdio'];
  timeoutMs?: number;
}

export interface ShellSafeCommand {
  command: string;
  shell: boolean;
}

export type SyncCommandRunner = (
  input: SyncCommandRunnerInput
) => CommandResult;

export function runSyncCommand(input: SyncCommandRunnerInput): CommandResult {
  const shell = input.shell ?? false;
  const shouldInlineShellArgs = shell && input.args.length > 0;
  const result = spawnSync(
    shouldInlineShellArgs
      ? buildShellCommandLine(input.command, input.args)
      : input.command,
    shell ? [] : input.args,
    {
      cwd: input.cwd,
      encoding: 'utf8',
      env: sanitizeEnv(input.env),
      input: input.input,
      shell,
      stdio: input.stdio ?? ['pipe', 'pipe', 'pipe'],
      timeout: input.timeoutMs
    }
  );

  return {
    error: result.error,
    status: result.status,
    stderr: result.stderr ?? '',
    stdout: result.stdout ?? ''
  };
}

export function tryRunSyncCommand(input: SyncCommandRunnerInput): boolean {
  const result = runSyncCommand(input);
  return !result.error && result.status === 0;
}

export function runSyncCommandOrThrow(input: SyncCommandRunnerInput): void {
  const result = runSyncCommand(input);
  if (result.error || result.status !== 0) {
    throw new Error(
      result.stderr.trim() ||
        result.stdout.trim() ||
        result.error?.message ||
        `Command failed: ${input.command} ${input.args.join(' ')}`
    );
  }
}

export function runBestEffortSyncCommand(input: SyncCommandRunnerInput): void {
  runSyncCommand(input);
}

export function getPnpmCommand(): string {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

export function getShellSafePackageManagerCommand(
  command: 'npm' | 'pnpm',
  platform: NodeJS.Platform = process.platform
): ShellSafeCommand {
  return {
    command,
    shell: platform === 'win32'
  };
}

export function sanitizeEnv(
  env: NodeJS.ProcessEnv | undefined
): NodeJS.ProcessEnv | undefined {
  if (!env) {
    return undefined;
  }

  const sanitizedEntries = Object.entries(env).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string'
  );
  return Object.fromEntries(sanitizedEntries);
}

// Omitted fields use this process, so existing callers keep the same lookup.
interface WindowsResolverDependencies {
  env?: NodeJS.ProcessEnv;
  existsSync?: (targetPath: string) => boolean;
  platform?: NodeJS.Platform;
  spawnSync?: WindowsWhereRunner;
}

interface WindowsWhereResult {
  error?: Error;
  status: number | null;
  stdout: string;
}

type WindowsWhereRunner = (
  command: string,
  args: readonly string[],
  options: {
    encoding: 'utf8';
    stdio: ['ignore', 'pipe', 'pipe'];
  }
) => WindowsWhereResult;

export function resolveWindowsPowerShellPath(
  dependencies: WindowsResolverDependencies = {}
): string | null {
  if ((dependencies.platform ?? process.platform) !== 'win32') {
    return null;
  }

  const fileExists = dependencies.existsSync ?? existsSync;
  const candidates = [
    'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    'C:\\Program Files\\PowerShell\\7\\pwsh.exe'
  ];

  return candidates.find((candidate) => fileExists(candidate)) ?? null;
}

export function resolveWindowsScriptPath(
  scriptName: string,
  dependencies: WindowsResolverDependencies = {}
): string | null {
  if ((dependencies.platform ?? process.platform) !== 'win32') {
    return null;
  }

  const env = dependencies.env ?? process.env;
  const fileExists = dependencies.existsSync ?? existsSync;
  const candidates = [
    env.APPDATA ? join(env.APPDATA, 'npm', scriptName) : null,
    env.NVM_SYMLINK ? join(env.NVM_SYMLINK, scriptName) : null
  ].filter((candidate): candidate is string => Boolean(candidate));

  for (const candidate of candidates) {
    if (fileExists(candidate)) {
      return candidate;
    }
  }

  // Call spawnSync directly so the utf8 overload still types stdout as string.
  const whereResult = dependencies.spawnSync
    ? dependencies.spawnSync('where.exe', [scriptName], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      })
    : runWhereExe(scriptName);

  if (whereResult.error || whereResult.status !== 0) {
    return null;
  }

  return (
    whereResult.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0 && fileExists(line)) ?? null
  );
}

function runWhereExe(scriptName: string): WindowsWhereResult {
  return spawnSync('where.exe', [scriptName], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

export function quoteWindowsArg(value: string): string {
  if (value.length === 0) {
    return '""';
  }

  if (!/[ \t"&()^<>|]/.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '\\"')}"`;
}

export function buildShellCommandLine(
  command: string,
  args: string[],
  platform: NodeJS.Platform = process.platform
): string {
  return [command, ...args]
    .map((part) => quoteShellArg(part, platform))
    .join(' ');
}

function quoteShellArg(value: string, platform: NodeJS.Platform): string {
  if (platform === 'win32') {
    return quoteWindowsArg(value);
  }

  if (value.length === 0) {
    return "''";
  }

  if (/^[A-Za-z0-9_./:=@+-]+$/.test(value)) {
    return value;
  }

  return `'${value.replace(/'/g, "'\\''")}'`;
}

export function encodePowerShellCommand(command: string): string {
  return Buffer.from(command, 'utf16le').toString('base64');
}
