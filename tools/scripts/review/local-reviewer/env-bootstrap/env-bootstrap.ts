import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  type HybridReviewProfileName,
  type LocalReviewDoctorReport,
  type LocalReviewReport,
  type LocalReviewerDependencies,
  LOCAL_REVIEWER_BUILD_TIMEOUT_MS,
  LOCAL_REVIEWER_COMMAND_TIMEOUT_MS,
  WINDOWS_PROCESS_BRIDGE_ENV,
  WINDOWS_PROCESS_BRIDGE_SCRIPT,
  type WindowsProcessBridgePayload,
  DEFAULT_OLLAMA_HOST,
  DEFAULT_OLLAMA_KEEP_ALIVE,
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_TIMEOUT_MS,
  encodePowerShellCommand,
  getPnpmCommand,
  resolveWindowsPowerShellPath,
  sanitizeEnv
} from '../shared/shared.ts';

export function createLocalReviewerDependencies(): LocalReviewerDependencies {
  return {
    now: () => new Date(),
    runProcess(input) {
      const sanitizedEnv = sanitizeEnv(input.env);

      if (process.platform === 'win32' && input.command.endsWith('.cmd')) {
        const powershellPath = resolveWindowsPowerShellPath();
        if (!powershellPath) {
          return {
            error: new Error(
              'Windows PowerShell is required to launch .cmd commands safely.'
            ),
            status: null,
            stderr: '',
            stdout: ''
          };
        }

        const bridgePayload = buildWindowsProcessBridgePayload({
          args: input.args,
          command: input.command,
          cwd: input.cwd
        });
        const payloadDir = mkdtempSync(join(tmpdir(), 'local-reviewer-win-'));
        const payloadPath = resolve(payloadDir, 'process.json');
        writeFileSync(payloadPath, JSON.stringify(bridgePayload), 'utf8');

        const result = (() => {
          try {
            return spawnSync(
              powershellPath,
              [
                '-NoProfile',
                '-NonInteractive',
                '-EncodedCommand',
                encodePowerShellCommand(WINDOWS_PROCESS_BRIDGE_SCRIPT)
              ],
              {
                cwd: input.cwd,
                encoding: 'utf8',
                env: {
                  ...(sanitizedEnv ?? {}),
                  [WINDOWS_PROCESS_BRIDGE_ENV]: payloadPath
                },
                input: input.input,
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: input.timeoutMs
              }
            );
          } finally {
            rmSync(payloadDir, { force: true, recursive: true });
          }
        })();

        return {
          error: result.error,
          status: result.status,
          stderr: result.stderr ?? '',
          stdout: result.stdout ?? ''
        };
      }

      const result = spawnSync(input.command, input.args, {
        cwd: input.cwd,
        encoding: 'utf8',
        env: sanitizedEnv,
        input: input.input,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: input.timeoutMs
      });

      return {
        error: result.error,
        status: result.status,
        stderr: result.stderr ?? '',
        stdout: result.stdout ?? ''
      };
    }
  };
}

export function resolveLocalReviewerRepoRoot(
  repoRoot: string,
  env: NodeJS.ProcessEnv = process.env
): string {
  const candidate = resolve(
    env.LOCAL_REVIEWER_CLI_PATH ?? resolve(repoRoot, '..', 'local-reviewer-cli')
  );
  const packageJsonPath = resolve(candidate, 'package.json');
  const cliEntryPath = resolve(
    candidate,
    'packages',
    'local-reviewer',
    'bin',
    'local-reviewer.js'
  );
  if (!existsSync(packageJsonPath) || !existsSync(cliEntryPath)) {
    throw new Error(
      `Unable to find a usable local-reviewer-cli workspace at ${candidate}.`
    );
  }

  return candidate;
}

export function createLocalReviewerEnv(
  baseEnv: NodeJS.ProcessEnv = process.env,
  overrides: Partial<NodeJS.ProcessEnv> = {}
): NodeJS.ProcessEnv {
  const model =
    overrides.LOCAL_REVIEWER_OLLAMA_MODEL ??
    overrides.LOCAL_REVIEWER_DEFAULT_MODEL ??
    baseEnv.LOCAL_REVIEWER_OLLAMA_MODEL ??
    baseEnv.LOCAL_REVIEWER_DEFAULT_MODEL ??
    DEFAULT_OLLAMA_MODEL;

  return {
    ...baseEnv,
    ...overrides,
    LOCAL_REVIEWER_RUNTIME:
      overrides.LOCAL_REVIEWER_RUNTIME ??
      baseEnv.LOCAL_REVIEWER_RUNTIME ??
      'ollama',
    LOCAL_REVIEWER_DEFAULT_MODEL:
      overrides.LOCAL_REVIEWER_DEFAULT_MODEL ??
      baseEnv.LOCAL_REVIEWER_DEFAULT_MODEL ??
      model,
    LOCAL_REVIEWER_OLLAMA_HOST:
      overrides.LOCAL_REVIEWER_OLLAMA_HOST ??
      baseEnv.LOCAL_REVIEWER_OLLAMA_HOST ??
      DEFAULT_OLLAMA_HOST,
    LOCAL_REVIEWER_OLLAMA_KEEP_ALIVE:
      overrides.LOCAL_REVIEWER_OLLAMA_KEEP_ALIVE ??
      baseEnv.LOCAL_REVIEWER_OLLAMA_KEEP_ALIVE ??
      DEFAULT_OLLAMA_KEEP_ALIVE,
    LOCAL_REVIEWER_OLLAMA_MODEL: model,
    LOCAL_REVIEWER_OLLAMA_THINK:
      overrides.LOCAL_REVIEWER_OLLAMA_THINK ??
      baseEnv.LOCAL_REVIEWER_OLLAMA_THINK ??
      'false',
    LOCAL_REVIEWER_OLLAMA_TIMEOUT_MS:
      overrides.LOCAL_REVIEWER_OLLAMA_TIMEOUT_MS ??
      baseEnv.LOCAL_REVIEWER_OLLAMA_TIMEOUT_MS ??
      DEFAULT_OLLAMA_TIMEOUT_MS
  };
}

export function buildWindowsProcessBridgePayload(input: {
  args: string[];
  command: string;
  cwd?: string;
}): WindowsProcessBridgePayload {
  return {
    args: [...input.args],
    command: input.command,
    cwd: input.cwd ?? process.cwd()
  };
}

export function ensureLocalReviewerBuild(
  toolRepoRoot: string,
  dependencies: LocalReviewerDependencies,
  env: NodeJS.ProcessEnv = process.env
): void {
  const result = dependencies.runProcess({
    command: getPnpmCommand(),
    args: ['nx', 'build', 'local-reviewer'],
    cwd: toolRepoRoot,
    env,
    timeoutMs: LOCAL_REVIEWER_BUILD_TIMEOUT_MS
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      result.stderr.trim() ||
        result.stdout.trim() ||
        result.error?.message ||
        'Failed to build local-reviewer-cli.'
    );
  }
}

export function runLocalReviewerDoctor(input: {
  dependencies: LocalReviewerDependencies;
  env?: NodeJS.ProcessEnv;
  targetRepoRoot: string;
  toolRepoRoot: string;
}): LocalReviewDoctorReport {
  return runLocalReviewerJsonCommand<LocalReviewDoctorReport>({
    dependencies: input.dependencies,
    env: input.env,
    targetRepoRoot: input.targetRepoRoot,
    toolRepoRoot: input.toolRepoRoot,
    subcommandArgs: ['doctor', '--json']
  });
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
      'Review mode requires either staged=true or base/head refs.'
    );
  }
  subcommandArgs.push('--json');

  return runLocalReviewerJsonCommand<LocalReviewReport>({
    dependencies: input.dependencies,
    env: buildLocalReviewerRequestedProfilesEnv(
      input.env,
      input.requestedProfiles
    ),
    targetRepoRoot: input.targetRepoRoot,
    toolRepoRoot: input.toolRepoRoot,
    subcommandArgs
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
        'local-reviewer.js'
      ),
      '--repo-root',
      input.targetRepoRoot,
      ...input.subcommandArgs
    ],
    cwd: input.toolRepoRoot,
    env: input.env,
    timeoutMs: LOCAL_REVIEWER_COMMAND_TIMEOUT_MS
  });

  if (result.error || result.status !== 0) {
    throw new Error(
      result.stderr.trim() ||
        result.stdout.trim() ||
        result.error?.message ||
        'local-reviewer execution failed.'
    );
  }

  try {
    return JSON.parse(result.stdout) as T;
  } catch (error) {
    throw new Error(
      `local-reviewer returned non-JSON output: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function buildLocalReviewerRequestedProfilesEnv(
  env: NodeJS.ProcessEnv | undefined,
  requestedProfiles: ReadonlyArray<HybridReviewProfileName> | undefined
): NodeJS.ProcessEnv | undefined {
  if (!env && (!requestedProfiles || requestedProfiles.length === 0)) {
    return undefined;
  }

  if (!requestedProfiles || requestedProfiles.length === 0) {
    return env;
  }

  return {
    ...(env ?? {}),
    LOCAL_REVIEWER_REQUESTED_PROFILES: requestedProfiles.join(',')
  };
}
