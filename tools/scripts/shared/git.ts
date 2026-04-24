import {
  runSyncCommand,
  type CommandResult,
  type SyncCommandRunner
} from './process.ts';
import { normalizeToolPath } from './paths.ts';

export interface RepoContext {
  root: string;
  branch: string | null;
  head: string | null;
  dirty: boolean | null;
  gitCommand: string | null;
}

export function runGitTextOrNull(input: {
  args: string[];
  cwd: string;
  gitCommand?: string;
  runner?: SyncCommandRunner;
  trimOutput?: boolean;
  timeoutMs?: number;
}): string | null {
  const result = (input.runner ?? runSyncCommand)({
    command: input.gitCommand ?? 'git',
    args: input.args,
    cwd: input.cwd,
    timeoutMs: input.timeoutMs
  });

  if (result.error || result.status !== 0) {
    return null;
  }

  return input.trimOutput === false ? result.stdout : result.stdout.trim();
}

export function runGitTextOrThrow(input: {
  args: string[];
  cwd: string;
  gitCommand?: string;
  runner?: SyncCommandRunner;
  timeoutMs?: number;
}): CommandResult {
  const result = (input.runner ?? runSyncCommand)({
    command: input.gitCommand ?? 'git',
    args: input.args,
    cwd: input.cwd,
    timeoutMs: input.timeoutMs
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      result.stderr.trim() ||
        result.stdout.trim() ||
        result.error?.message ||
        `Git command failed: ${input.gitCommand ?? 'git'} ${input.args.join(' ')}`
    );
  }

  return result;
}

export function resolveGitCommand(
  input: {
    cwd?: string;
    runner?: SyncCommandRunner;
  } = {}
): string | null {
  const candidates =
    process.platform === 'win32'
      ? [
          'git',
          'C:\\Program Files\\Git\\cmd\\git.exe',
          'C:\\Program Files\\Git\\bin\\git.exe'
        ]
      : ['git', '/usr/bin/git', '/usr/local/bin/git'];

  for (const candidate of candidates) {
    const output = runGitTextOrNull({
      args: ['--version'],
      cwd: input.cwd ?? process.cwd(),
      gitCommand: candidate,
      runner: input.runner
    });
    if (output) {
      return candidate;
    }
  }

  return null;
}

export function getRepoContext(
  input: {
    cwd?: string;
    runner?: SyncCommandRunner;
  } = {}
): RepoContext {
  const cwd = input.cwd ?? process.cwd();
  const gitCommand = resolveGitCommand({ cwd, runner: input.runner });

  if (!gitCommand) {
    return {
      root: cwd,
      branch: null,
      head: null,
      dirty: null,
      gitCommand: null
    };
  }

  const root =
    runGitTextOrNull({
      args: ['rev-parse', '--show-toplevel'],
      cwd,
      gitCommand,
      runner: input.runner
    }) ?? cwd;
  const branch = runGitTextOrNull({
    args: ['rev-parse', '--abbrev-ref', 'HEAD'],
    cwd: root,
    gitCommand,
    runner: input.runner
  });
  const head = runGitTextOrNull({
    args: ['rev-parse', 'HEAD'],
    cwd: root,
    gitCommand,
    runner: input.runner
  });
  const dirtyOutput = runGitTextOrNull({
    args: ['status', '--porcelain', '--untracked-files=all'],
    cwd: root,
    gitCommand,
    runner: input.runner
  });

  return {
    root,
    branch,
    head,
    dirty: dirtyOutput ? dirtyOutput.length > 0 : false,
    gitCommand
  };
}

export function collectRepoChangedFiles(input: {
  repoRoot: string;
  runner?: SyncCommandRunner;
}): string[] {
  const statusLines = collectRepoStatusLines(input);
  if (statusLines.length === 0) {
    return [];
  }

  const changedFiles = statusLines.map(parsePorcelainPath).filter(Boolean);

  return changedFiles.map(normalizeToolPath);
}

export function collectRepoHasUntrackedFiles(input: {
  repoRoot: string;
  runner?: SyncCommandRunner;
}): boolean {
  return collectRepoStatusLines(input).some((line) => line.startsWith('?? '));
}

export function collectRepoDiffText(input: {
  repoRoot: string;
  runner?: SyncCommandRunner;
}): string {
  const commands = [
    ['diff', '--no-color', '--no-ext-diff'],
    ['diff', '--no-color', '--no-ext-diff', '--cached']
  ];

  const outputs = commands
    .map((args) =>
      runGitTextOrNull({
        args,
        cwd: input.repoRoot,
        runner: input.runner
      })
    )
    .filter((output): output is string => Boolean(output));

  return outputs.join('\n').trim();
}

function collectRepoStatusLines(input: {
  repoRoot: string;
  runner?: SyncCommandRunner;
}): string[] {
  const output = runGitTextOrNull({
    args: ['status', '--porcelain', '--untracked-files=all'],
    cwd: input.repoRoot,
    runner: input.runner,
    trimOutput: false
  });

  if (!output) {
    return [];
  }

  return output
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

function parsePorcelainPath(line: string): string {
  const candidate = line.slice(3).trim();
  const renameSegments = candidate.split(' -> ');
  return renameSegments.at(-1)?.trim() ?? candidate;
}
