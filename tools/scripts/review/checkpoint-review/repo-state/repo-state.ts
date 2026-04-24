import { spawnSync } from 'node:child_process';

import { normalizeReviewPathList } from '../path-utils/path-utils.ts';

export function collectRepoChangedFiles(repoRoot: string): string[] {
  const statusLines = collectRepoStatusLines(repoRoot);
  if (statusLines.length === 0) {
    return [];
  }

  const changedFiles = statusLines.map(parsePorcelainPath).filter(Boolean);

  return normalizeReviewPathList(changedFiles);
}

export function collectRepoHasUntrackedFiles(repoRoot: string): boolean {
  return collectRepoStatusLines(repoRoot).some((line) =>
    line.startsWith('?? ')
  );
}

export function collectRepoDiffText(repoRoot: string): string {
  const commands = [
    ['diff', '--no-color', '--no-ext-diff'],
    ['diff', '--no-color', '--no-ext-diff', '--cached']
  ];

  const outputs = commands
    .map((args) =>
      spawnSync('git', args, {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      })
    )
    .filter((result) => !result.error && result.status === 0)
    .map((result) => result.stdout?.trim() ?? '')
    .filter(Boolean);

  return outputs.join('\n').trim();
}

function collectRepoStatusLines(repoRoot: string): string[] {
  const result = spawnSync(
    'git',
    ['status', '--porcelain', '--untracked-files=all'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }
  );

  if (result.error || result.status !== 0 || !result.stdout) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

function parsePorcelainPath(line: string): string {
  const candidate = line.slice(3).trim();
  const renameSegments = candidate.split(' -> ');
  return renameSegments.at(-1)?.trim() ?? candidate;
}
