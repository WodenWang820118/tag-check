import { basename, resolve } from 'node:path';

import {
  type CommandResult,
  type EvaluationRepoTarget,
  type EvaluationSample,
  type LocalReviewerDependencies,
  LOCAL_REVIEWER_COMMAND_TIMEOUT_MS,
  shuffleWithSeed
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

export function collectRepoCommitCandidates(input: {
  dependencies: LocalReviewerDependencies;
  repoName: string;
  repoRoot: string;
  seed: number;
}): EvaluationSample[] {
  return sampleRepoCommits(
    input.repoRoot,
    input.repoName,
    input.dependencies,
    input.seed
  );
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
  const result = dependencies.runProcess({
    command: 'git',
    args,
    cwd: repoRoot,
    timeoutMs: LOCAL_REVIEWER_COMMAND_TIMEOUT_MS
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      result.stderr.trim() ||
        result.stdout.trim() ||
        result.error?.message ||
        `Git command failed: git ${args.join(' ')}`
    );
  }

  return result;
}

function sampleRepoCommits(
  repoRoot: string,
  repoName: string,
  dependencies: LocalReviewerDependencies,
  seed: number
): EvaluationSample[] {
  const sinceDate = new Date(
    Date.now() - 60 * 24 * 60 * 60 * 1000
  ).toISOString();
  const logResult = runGitCommand(
    repoRoot,
    ['log', '--since', sinceDate, '--no-merges', '--format=%H%x1f%ct%x1f%s'],
    dependencies
  );

  const candidates = logResult.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [commit, epochRaw, subject] = line.split('\u001f');
      const baseRef = resolveParentCommit(repoRoot, commit, dependencies);
      if (!baseRef) {
        return null;
      }

      const numstat = runGitCommand(
        repoRoot,
        ['diff', '--numstat', baseRef, commit],
        dependencies
      ).stdout;
      const parsed = parseNumstat(numstat);
      if (parsed.binary || parsed.fileCount === 0 || parsed.fileCount > 20) {
        return null;
      }

      return {
        baseRef,
        commit,
        committedAtEpoch: Number.parseInt(epochRaw ?? '0', 10),
        fileCount: parsed.fileCount,
        kind: classifySample(parsed.files, parsed.totalChangedLines),
        repoName,
        repoRoot,
        subject: subject ?? '<no subject>',
        totalChangedLines: parsed.totalChangedLines
      } satisfies EvaluationSample;
    })
    .filter((sample): sample is EvaluationSample => sample !== null);

  return shuffleWithSeed(candidates, seed);
}

function classifySample(
  files: string[],
  totalChangedLines: number
): EvaluationSample['kind'] {
  if (
    files.some((file) =>
      /(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|nx\.json|tsconfig|project\.json|\.ya?ml|\.json|\.toml|README\.md)$/i.test(
        file
      )
    )
  ) {
    return 'workspace-config';
  }

  if (
    files.some((file) =>
      /(auth|secret|token|password|migration|database|schema|controller|dto)/i.test(
        file
      )
    )
  ) {
    return 'higher-risk';
  }

  if (files.length >= 4) {
    return 'multi-file-refactor';
  }

  const codeFiles = files.filter((file) =>
    /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/i.test(file)
  );
  if (
    codeFiles.length === files.length &&
    files.length <= 2 &&
    totalChangedLines <= 120
  ) {
    return 'small-ts';
  }

  return 'general';
}

function parseNumstat(stdout: string): {
  binary: boolean;
  fileCount: number;
  files: string[];
  totalChangedLines: number;
} {
  let binary = false;
  let totalChangedLines = 0;
  const files: string[] = [];

  for (const line of stdout.split(/\r?\n/)) {
    const normalized = line.trim();
    if (!normalized) {
      continue;
    }

    const [addedRaw, deletedRaw, filePath] = normalized.split('\t');
    if (!filePath) {
      continue;
    }
    if (addedRaw === '-' || deletedRaw === '-') {
      binary = true;
      break;
    }

    files.push(filePath);
    totalChangedLines += Number.parseInt(addedRaw ?? '0', 10);
    totalChangedLines += Number.parseInt(deletedRaw ?? '0', 10);
  }

  return {
    binary,
    fileCount: files.length,
    files,
    totalChangedLines
  };
}

function resolveParentCommit(
  repoRoot: string,
  commit: string,
  dependencies: LocalReviewerDependencies
): string | null {
  const result = dependencies.runProcess({
    command: 'git',
    args: ['rev-parse', `${commit}^`],
    cwd: repoRoot,
    timeoutMs: LOCAL_REVIEWER_COMMAND_TIMEOUT_MS
  });

  if (result.error || result.status !== 0) {
    return null;
  }

  return result.stdout.trim() || null;
}
