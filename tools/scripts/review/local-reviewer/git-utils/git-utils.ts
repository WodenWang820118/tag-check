import { basename, resolve } from 'node:path';

import { runGitTextOrThrow } from '../../../shared/git.ts';
import {
  type CommandResult,
  type EvaluationRepoTarget,
  type LocalReviewerDependencies,
  LOCAL_REVIEWER_COMMAND_TIMEOUT_MS
} from '../shared/shared.ts';

export function collectDiffText(input: {
  baseRef?: string;
  dependencies: LocalReviewerDependencies;
  headRef?: string;
  repoRoot: string;
  staged: boolean;
}): string {
  const args = input.staged
    ? ['diff', '--cached', '--no-color', '--unified=3', '--no-ext-diff']
    : [
        'diff',
        '--no-color',
        '--unified=3',
        input.baseRef ?? '',
        input.headRef ?? '',
        '--no-ext-diff'
      ];

  const result = runGitCommand(
    input.repoRoot,
    args.filter(Boolean),
    input.dependencies
  );
  return result.stdout.trim();
}

export function collectChangedFiles(input: {
  baseRef?: string;
  dependencies: LocalReviewerDependencies;
  headRef?: string;
  repoRoot: string;
  staged: boolean;
}): string[] {
  const args = input.staged
    ? ['diff', '--cached', '--name-only']
    : ['diff', '--name-only', input.baseRef ?? '', input.headRef ?? ''];
  const result = runGitCommand(
    input.repoRoot,
    args.filter(Boolean),
    input.dependencies
  );

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function resolveEvaluationRepoTarget(
  currentRepoRoot: string,
  repoInput: string,
  knownRepoNames: ReadonlyArray<string>
): EvaluationRepoTarget {
  if (knownRepoNames.includes(repoInput)) {
    return {
      name: repoInput,
      root: resolve(currentRepoRoot, '..', repoInput)
    };
  }

  const root = resolve(currentRepoRoot, repoInput);
  return {
    name: basename(root),
    root
  };
}

function runGitCommand(
  repoRoot: string,
  args: string[],
  dependencies: LocalReviewerDependencies
): CommandResult {
  return runGitTextOrThrow({
    args,
    cwd: repoRoot,
    runner: dependencies.runProcess,
    timeoutMs: LOCAL_REVIEWER_COMMAND_TIMEOUT_MS
  });
}
