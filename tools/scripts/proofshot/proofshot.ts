/// <reference types="node" />

import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  getFlagValue,
  hasFlag,
  stripFlagWithValue,
  stripNpmPassthroughSeparator
} from '../shared/cli.ts';
import {
  isDirectEntrypoint,
  resolveWorkspaceRootFromModuleUrl
} from '../shared/paths.ts';
import { quoteWindowsArg, runSyncCommand } from '../shared/process.ts';

const workspaceRoot = resolveWorkspaceRootFromModuleUrl(import.meta.url, 3);
const artifactsDir = resolve(workspaceRoot, 'proofshot-artifacts');

// ProofShot is machine-level tooling, so this wrapper keeps repo defaults in
// package scripts while still forwarding user-supplied ProofShot flags.
export const DEFAULT_PROOFSHOT_PORT = '4200';
export const DEFAULT_PROOFSHOT_PROJECT = 'ng-frontend';
export const SUPPORTED_PROOFSHOT_PROJECTS = [
  'ng-frontend',
  'ng-tag-build',
  'ng-product-doc'
] as const;

export type SupportedProofshotProject =
  (typeof SUPPORTED_PROOFSHOT_PROJECTS)[number];

export { stripFlagWithValue } from '../shared/cli.ts';

export function buildServeCommand(
  project: SupportedProofshotProject,
  port: string
): string {
  return `pnpm nx run ${project}:serve:development --port ${port}`;
}

export function buildStartWebArgs(rawExtraArgs: ReadonlyArray<string>): {
  args: string[];
  description: string;
  port: string;
  project: SupportedProofshotProject;
  runCommand: string | null;
} {
  const normalizedExtraArgs = stripNpmPassthroughSeparator([...rawExtraArgs]);
  const projectInput =
    getFlagValue(normalizedExtraArgs, '--project') ?? DEFAULT_PROOFSHOT_PROJECT;
  const project = assertSupportedProject(projectInput);
  const extraArgs = stripFlagWithValue(normalizedExtraArgs, '--project');
  if (hasFlag(extraArgs, '--run') && !hasFlag(extraArgs, '--port')) {
    throw new Error(
      'Custom ProofShot runs require --port so the browser target stays explicit.'
    );
  }
  const port = getFlagValue(extraArgs, '--port') ?? DEFAULT_PROOFSHOT_PORT;
  const description =
    getFlagValue(extraArgs, '--description') ??
    `Tag Check browser verification (${project})`;
  const runCommand = hasFlag(extraArgs, '--run')
    ? null
    : buildServeCommand(project, port);

  const args = ['start'];
  if (runCommand) {
    args.push('--run', runCommand);
  }
  if (!hasFlag(extraArgs, '--port')) {
    args.push('--port', port);
  }
  if (!hasFlag(extraArgs, '--description')) {
    args.push('--description', description);
  }
  args.push(...extraArgs);

  return {
    args,
    description,
    port,
    project,
    runCommand
  };
}

export function runSubcommand(
  argv: ReadonlyArray<string> = process.argv
): void {
  const subcommand = argv[2];
  const extraArgs = stripNpmPassthroughSeparator([...argv.slice(3)]);

  if (!subcommand) {
    throw new Error(
      'Usage: node tools/scripts/proofshot/proofshot.ts <check|start-web|stop|clean> [proofshot args]'
    );
  }

  switch (subcommand) {
    case 'check':
      checkProofshot();
      break;
    case 'start-web':
      startWeb(extraArgs);
      break;
    case 'stop':
      stopSession(extraArgs);
      break;
    case 'clean':
      cleanArtifacts(extraArgs);
      break;
    default:
      throw new Error(`Unknown proofshot command: ${subcommand}`);
  }
}

function startWeb(extraArgs: ReadonlyArray<string>): void {
  ensureProofshotInstalled();

  const config = buildStartWebArgs(extraArgs);
  console.log(
    `Starting ProofShot for ${config.project} on port ${config.port}. Drive the browser with "proofshot exec ..." or agent-browser commands, then run "pnpm proofshot:stop".`
  );
  runProofshot(config.args);
}

function stopSession(extraArgs: ReadonlyArray<string>): void {
  ensureProofshotInstalled();
  runProofshot(['stop', ...extraArgs]);
}

function cleanArtifacts(extraArgs: ReadonlyArray<string>): void {
  const proofshot = resolveProofshotCommand();
  if (proofshot.found) {
    runProofshot(['clean', ...extraArgs]);
    return;
  }

  rmSync(artifactsDir, { recursive: true, force: true });
  console.log(`Removed ${artifactsDir}`);
}

function checkProofshot(): void {
  const proofshot = resolveProofshotCommand();
  if (!proofshot.found) {
    printInstallGuidance();
    process.exit(1);
  }

  const result = spawnProofshot(['--version'], true);
  if (result.error || result.status !== 0) {
    printInstallGuidance();
    process.exit(result.status ?? 1);
  }

  const version = (result.stdout ?? '').trim();
  console.log(`ProofShot is available: ${version || proofshot.command}`);
  console.log(
    'Machine-level setup reminder: run "npm install -g proofshot" and then "proofshot install" once on this machine.'
  );
}

function ensureProofshotInstalled(): void {
  const proofshot = resolveProofshotCommand();
  if (proofshot.found) {
    return;
  }

  printInstallGuidance();
  process.exit(1);
}

function printInstallGuidance(): void {
  console.error(
    'ProofShot CLI not found. Install it globally with "npm install -g proofshot" and then run "proofshot install".'
  );
}

function resolveProofshotCommand(): { command: string; found: boolean } {
  const configured = process.env.PROOFSHOT_BIN?.trim();
  if (configured) {
    return {
      command: configured,
      found: isCommandAvailable(configured)
    };
  }

  const candidates =
    process.platform === 'win32'
      ? ['proofshot.cmd', 'proofshot']
      : ['proofshot'];

  for (const candidate of candidates) {
    if (isCommandAvailable(candidate)) {
      return { command: candidate, found: true };
    }
  }

  return {
    command: process.platform === 'win32' ? 'proofshot.cmd' : 'proofshot',
    found: false
  };
}

function isCommandAvailable(command: string): boolean {
  const result = spawnProofshot(['--version'], true, command);
  return !result.error && result.status === 0;
}

function runProofshot(args: string[]): void {
  const result = spawnProofshot(args, false);
  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
}

function spawnProofshot(
  args: string[],
  captureOutput: boolean,
  overrideCommand?: string
) {
  const command =
    overrideCommand ??
    (process.platform === 'win32' ? 'proofshot.cmd' : 'proofshot');

  if (process.platform === 'win32') {
    const commandLine = [quoteWindowsArg(command), ...args.map(quoteWindowsArg)]
      .join(' ')
      .trim();

    return runSyncCommand({
      command: commandLine,
      args: [],
      cwd: workspaceRoot,
      shell: true,
      stdio: captureOutput ? 'pipe' : 'inherit'
    });
  }

  return runSyncCommand({
    command,
    args,
    cwd: workspaceRoot,
    stdio: captureOutput ? 'pipe' : 'inherit'
  });
}

function assertSupportedProject(project: string): SupportedProofshotProject {
  if ((SUPPORTED_PROOFSHOT_PROJECTS as readonly string[]).includes(project)) {
    return project as SupportedProofshotProject;
  }

  throw new Error(
    `Unsupported proofshot project "${project}". Expected one of: ${SUPPORTED_PROOFSHOT_PROJECTS.join(', ')}.`
  );
}

if (!existsSync(workspaceRoot)) {
  throw new Error(`Workspace root not found: ${workspaceRoot}`);
}

if (isDirectEntrypoint(import.meta.url)) {
  runSubcommand();
}
