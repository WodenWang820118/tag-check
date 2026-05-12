import {
  LOCAL_REVIEWER_COMMAND_TIMEOUT_MS,
  normalizeHybridPath,
  type CommandResult,
  type EvaluationSample,
  type LocalReviewerDependencies,
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
        '--no-ext-diff',
      ];

  const result = runGitCommand(
    input.repoRoot,
    args.filter(Boolean),
    input.dependencies,
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
    input.dependencies,
  );

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function buildCheckpointReviewContext(input: {
  changedFiles: ReadonlyArray<string>;
  diffText: string;
  sample: EvaluationSample;
}): string {
  return [
    `Repository: ${input.sample.repoName}`,
    `Commit: ${input.sample.commit}`,
    `Base ref: ${input.sample.baseRef}`,
    `Head ref: ${input.sample.commit}`,
    `Subject: ${input.sample.subject}`,
    `Kind: ${input.sample.kind}`,
    '',
    'Changed files:',
    ...input.changedFiles.map((file) => `- ${normalizeHybridPath(file)}`),
    '',
    'Diff to review:',
    input.diffText.trim(),
  ].join('\n');
}

export function runGitCommand(
  repoRoot: string,
  args: string[],
  dependencies: LocalReviewerDependencies,
): CommandResult {
  const result = dependencies.runProcess({
    command: 'git',
    args,
    cwd: repoRoot,
    timeoutMs: LOCAL_REVIEWER_COMMAND_TIMEOUT_MS,
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      result.stderr.trim() ||
        result.stdout.trim() ||
        result.error?.message ||
        `Git command failed: git ${args.join(' ')}`,
    );
  }

  return result;
}
