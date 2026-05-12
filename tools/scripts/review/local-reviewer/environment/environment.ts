import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  DEFAULT_OLLAMA_HOST,
  DEFAULT_OLLAMA_KEEP_ALIVE,
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_TIMEOUT_MS,
  WINDOWS_PROCESS_BRIDGE_ENV,
  WINDOWS_PROCESS_BRIDGE_SCRIPT,
  type LocalReviewerDependencies,
  type WindowsProcessBridgePayload,
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
              'Windows PowerShell is required to launch .cmd commands safely.',
            ),
            status: null,
            stderr: '',
            stdout: '',
          };
        }

        const bridgePayload = buildWindowsProcessBridgePayload({
          args: input.args,
          command: input.command,
          cwd: input.cwd,
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
                encodePowerShellCommand(WINDOWS_PROCESS_BRIDGE_SCRIPT),
              ],
              {
                cwd: input.cwd,
                encoding: 'utf8',
                env: {
                  ...(sanitizedEnv ?? {}),
                  [WINDOWS_PROCESS_BRIDGE_ENV]: payloadPath,
                },
                input: input.input,
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: input.timeoutMs,
              },
            );
          } finally {
            rmSync(payloadDir, { force: true, recursive: true });
          }
        })();

        return {
          error: result.error,
          status: result.status,
          stderr: result.stderr ?? '',
          stdout: result.stdout ?? '',
        };
      }

      const result = spawnSync(input.command, input.args, {
        cwd: input.cwd,
        encoding: 'utf8',
        env: sanitizedEnv,
        input: input.input,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: input.timeoutMs,
      });

      return {
        error: result.error,
        status: result.status,
        stderr: result.stderr ?? '',
        stdout: result.stdout ?? '',
      };
    },
  };
}

export function resolveLocalReviewerRepoRoot(
  repoRoot: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const candidate = resolve(
    env.LOCAL_REVIEWER_CLI_PATH ??
      resolve(repoRoot, '..', 'local-reviewer-cli'),
  );
  const packageJsonPath = resolve(candidate, 'package.json');
  const cliEntryPath = resolve(
    candidate,
    'packages',
    'local-reviewer',
    'bin',
    'local-reviewer.js',
  );
  if (!existsSync(packageJsonPath) || !existsSync(cliEntryPath)) {
    throw new Error(
      `Unable to find a usable local-reviewer-cli workspace at ${candidate}.`,
    );
  }

  return candidate;
}

export function createLocalReviewerEnv(
  baseEnv: NodeJS.ProcessEnv = process.env,
  overrides: Partial<NodeJS.ProcessEnv> = {},
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
      DEFAULT_OLLAMA_TIMEOUT_MS,
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
    cwd: input.cwd ?? process.cwd(),
  };
}

export function getPnpmCommand(): string {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

export function sanitizeEnv(
  env: NodeJS.ProcessEnv | undefined,
): NodeJS.ProcessEnv | undefined {
  if (!env) {
    return undefined;
  }

  const sanitizedEntries = Object.entries(env).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
  return Object.fromEntries(sanitizedEntries);
}

export function resolveWindowsPowerShellPath(): string | null {
  if (process.platform !== 'win32') {
    return null;
  }

  const candidates = [
    'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

export function encodePowerShellCommand(command: string): string {
  return Buffer.from(command, 'utf16le').toString('base64');
}
