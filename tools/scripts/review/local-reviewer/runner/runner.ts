import { resolve } from 'node:path';

import { getPnpmCommand } from '../environment/environment.ts';
import {
  LOCAL_REVIEWER_BUILD_TIMEOUT_MS,
  LOCAL_REVIEWER_COMMAND_TIMEOUT_MS,
  type HybridReviewProfileName,
  type LocalReviewDoctorReport,
  type LocalReviewerDependencies,
  type LocalReviewReport,
} from '../shared/shared.ts';

export function ensureLocalReviewerBuild(
  toolRepoRoot: string,
  dependencies: LocalReviewerDependencies,
  env: NodeJS.ProcessEnv = process.env,
): void {
  const result = dependencies.runProcess({
    command: getPnpmCommand(),
    args: ['nx', 'build', 'local-reviewer'],
    cwd: toolRepoRoot,
    env,
    timeoutMs: LOCAL_REVIEWER_BUILD_TIMEOUT_MS,
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      result.stderr.trim() ||
        result.stdout.trim() ||
        result.error?.message ||
        'Failed to build local-reviewer-cli.',
    );
  }
}

export function runLocalReviewerDoctor(input: {
  dependencies: LocalReviewerDependencies;
  env?: NodeJS.ProcessEnv;
  targetRepoRoot: string;
  toolRepoRoot: string;
}): LocalReviewDoctorReport {
  const payload = runLocalReviewerJsonCommand<LocalReviewDoctorReport>({
    dependencies: input.dependencies,
    env: input.env,
    targetRepoRoot: input.targetRepoRoot,
    toolRepoRoot: input.toolRepoRoot,
    subcommandArgs: ['doctor', '--json'],
  });

  return payload;
}

export function runLocalReviewerReview(input: {
  baseRef?: string;
  dependencies: LocalReviewerDependencies;
  env?: NodeJS.ProcessEnv;
  headRef?: string;
  requestedProfiles?: ReadonlyArray<HybridReviewProfileName>;
  staged: boolean;
  targetRepoRoot: string;
  toolRepoRoot: string;
}): LocalReviewReport {
  const subcommandArgs = ['review'];
  if (input.staged) {
    subcommandArgs.push('--staged');
  } else if (input.baseRef && input.headRef) {
    subcommandArgs.push('--base', input.baseRef, '--head', input.headRef);
  } else {
    throw new Error(
      'Review mode requires either staged=true or base/head refs.',
    );
  }
  subcommandArgs.push('--json');

  return runLocalReviewerJsonCommand<LocalReviewReport>({
    dependencies: input.dependencies,
    env: buildLocalReviewerRequestedProfilesEnv(
      input.env,
      input.requestedProfiles,
    ),
    targetRepoRoot: input.targetRepoRoot,
    toolRepoRoot: input.toolRepoRoot,
    subcommandArgs,
  });
}

function runLocalReviewerJsonCommand<T>(input: {
  dependencies: LocalReviewerDependencies;
  env?: NodeJS.ProcessEnv;
  subcommandArgs: string[];
  targetRepoRoot: string;
  toolRepoRoot: string;
}): T {
  const result = input.dependencies.runProcess({
    command: 'node',
    args: [
      resolve(
        input.toolRepoRoot,
        'packages',
        'local-reviewer',
        'bin',
        'local-reviewer.js',
      ),
      '--repo-root',
      input.targetRepoRoot,
      ...input.subcommandArgs,
    ],
    cwd: input.toolRepoRoot,
    env: input.env,
    timeoutMs: LOCAL_REVIEWER_COMMAND_TIMEOUT_MS,
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      result.stderr.trim() ||
        result.stdout.trim() ||
        result.error?.message ||
        'local-reviewer execution failed.',
    );
  }

  try {
    return JSON.parse(result.stdout) as T;
  } catch (error) {
    throw new Error(
      `local-reviewer returned non-JSON output: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function buildLocalReviewerRequestedProfilesEnv(
  env: NodeJS.ProcessEnv | undefined,
  requestedProfiles: ReadonlyArray<HybridReviewProfileName> | undefined,
): NodeJS.ProcessEnv | undefined {
  if (!env && (!requestedProfiles || requestedProfiles.length === 0)) {
    return undefined;
  }

  if (!requestedProfiles || requestedProfiles.length === 0) {
    return env;
  }

  return {
    ...(env ?? {}),
    LOCAL_REVIEWER_REQUESTED_PROFILES: requestedProfiles.join(','),
  };
}
