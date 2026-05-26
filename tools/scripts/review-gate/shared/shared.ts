// region Imports
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export type {
  HookInput,
  HookPermissionResult,
  ParsedReviewGateArgs,
  PrimaryFamily,
  RepoContext,
  ReviewApproval,
  ReviewGateMode,
  ReviewGateState,
  SupportedReviewer,
  TaskSize
} from './contracts.ts';
export {
  PRIMARY_FAMILIES,
  REVIEW_GATE_MODES,
  SUPPORTED_REVIEWERS,
  TASK_SIZES
} from './contracts.ts';
import type {
  HookInput,
  HookPermissionResult,
  ParsedReviewGateArgs,
  PrimaryFamily,
  RepoContext,
  ReviewApproval,
  ReviewGateMode,
  ReviewGateState,
  SupportedReviewer,
  TaskSize
} from './contracts.ts';
import {
  PRIMARY_FAMILIES,
  REVIEW_GATE_MODES,
  SUPPORTED_REVIEWERS,
  TASK_SIZES
} from './contracts.ts';
import {
  DEFAULT_MAX_FILES_BY_SIZE,
  REVIEW_GATE_ENTRYPOINT_COMMAND_PATTERN,
  REVIEW_GATE_SCRIPT_ALIAS_PATTERN,
  REVIEW_TTL_MS,
  REVIEWER_FAMILY,
  RISKY_SHELL_SYNTAX_PATTERNS
} from './constants.ts';
// endregion

// region Reviewer / family utilities

export function getReviewerFamily(reviewer: SupportedReviewer): PrimaryFamily {
  return REVIEWER_FAMILY[reviewer];
}

export function defaultMaxFilesForSize(size: TaskSize): number | null {
  return DEFAULT_MAX_FILES_BY_SIZE[size];
}

export function validateFamily(value: string): PrimaryFamily {
  if ((PRIMARY_FAMILIES as readonly string[]).includes(value)) {
    return value as PrimaryFamily;
  }
  throw new Error(
    `Unsupported primary family "${value}". Expected one of: ${PRIMARY_FAMILIES.join(', ')}.`
  );
}

export function validateTaskSize(value: string): TaskSize {
  if ((TASK_SIZES as readonly string[]).includes(value)) {
    return value as TaskSize;
  }
  throw new Error(
    `Unsupported task size "${value}". Expected one of: ${TASK_SIZES.join(', ')}.`
  );
}

export function validateGateMode(value: string): ReviewGateMode {
  if ((REVIEW_GATE_MODES as readonly string[]).includes(value)) {
    return value as ReviewGateMode;
  }
  throw new Error(
    `Unsupported gate mode "${value}". Expected one of: ${REVIEW_GATE_MODES.join(', ')}.`
  );
}

export function assertCrossFamilyReviewer(input: {
  reviewer: SupportedReviewer;
  primaryFamily: PrimaryFamily | null;
  mode: ReviewGateMode;
  overrideReason: string | null;
}): void {
  if (input.primaryFamily === null) {
    return;
  }
  const reviewerFamily = getReviewerFamily(input.reviewer);
  if (reviewerFamily !== input.primaryFamily) {
    return;
  }
  if (input.mode === 'override' && input.overrideReason) {
    return;
  }
  throw new Error(
    `Reviewer "${input.reviewer}" (${reviewerFamily}) is in the same AI family as the primary agent (${input.primaryFamily}). Use a cross-family reviewer or rerun with --mode override --override-reason "<rationale>".`
  );
}

export function validateReviewerId(reviewer: string): SupportedReviewer {
  if ((SUPPORTED_REVIEWERS as readonly string[]).includes(reviewer)) {
    return reviewer as SupportedReviewer;
  }

  throw new Error(
    `Unsupported reviewer "${reviewer}". Expected one of: ${SUPPORTED_REVIEWERS.join(', ')}.`
  );
}
// endregion

// region Git utilities

function trySpawn(command: string, args: string[], cwd: string): string | null {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  });

  if (result.error || result.status !== 0) {
    return null;
  }

  return result.stdout.trim();
}

export function resolveGitCommand(): string | null {
  const candidates =
    process.platform === 'win32'
      ? [
          'git',
          'C:\\Program Files\\Git\\cmd\\git.exe',
          'C:\\Program Files\\Git\\bin\\git.exe'
        ]
      : ['git', '/usr/bin/git', '/usr/local/bin/git'];

  for (const candidate of candidates) {
    const output = trySpawn(candidate, ['--version'], process.cwd());
    if (output) {
      return candidate;
    }
  }

  return null;
}

export function getRepoContext(cwd = process.cwd()): RepoContext {
  const gitCommand = resolveGitCommand();

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
    trySpawn(gitCommand, ['rev-parse', '--show-toplevel'], cwd) ?? cwd;
  const branch = trySpawn(
    gitCommand,
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    root
  );
  const head = trySpawn(gitCommand, ['rev-parse', 'HEAD'], root);
  const dirtyOutput = trySpawn(
    gitCommand,
    ['status', '--porcelain', '--untracked-files=all'],
    root
  );

  return {
    root,
    branch,
    head,
    dirty: dirtyOutput ? dirtyOutput.length > 0 : false,
    gitCommand
  };
}
// endregion

// region State management

export function getStatePath(repoRoot = process.cwd()): string {
  return path.join(repoRoot, '.cache', 'review-gate', 'state.json');
}

export function loadState(repoRoot = process.cwd()): ReviewGateState | null {
  const statePath = getStatePath(repoRoot);

  if (!fs.existsSync(statePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8')) as ReviewGateState;
  } catch {
    return null;
  }
}

export function saveState(
  state: ReviewGateState,
  repoRoot = process.cwd()
): void {
  const statePath = getStatePath(repoRoot);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
}

export function resetState(repoRoot = process.cwd()): void {
  const statePath = getStatePath(repoRoot);
  if (fs.existsSync(statePath)) {
    fs.rmSync(statePath, { force: true });
  }
}
// endregion

// region Approval lifecycle

export function createApproval(input: {
  reviewer: SupportedReviewer;
  focus: string;
  summary: string;
  repoContext: RepoContext;
  primaryFamily?: PrimaryFamily | null;
  taskSize?: TaskSize | null;
  mode?: ReviewGateMode;
  maxFiles?: number | null;
  overrideReason?: string | null;
}): ReviewGateState {
  const approvedAt = new Date().toISOString();
  const taskSize = input.taskSize ?? null;
  const mode = input.mode ?? 'standard';
  const resolvedMaxFiles =
    input.maxFiles ?? (taskSize ? defaultMaxFilesForSize(taskSize) : null);
  return {
    version: 1,
    approval: {
      type: 'pre-implementation-review',
      reviewer: input.reviewer,
      focus: input.focus,
      summary: input.summary,
      approvedAt,
      expiresAt: new Date(Date.now() + REVIEW_TTL_MS).toISOString(),
      branch: input.repoContext.branch,
      head: input.repoContext.head,
      root: input.repoContext.root,
      primaryFamily: input.primaryFamily ?? null,
      taskSize,
      mode,
      maxFiles: resolvedMaxFiles,
      overrideReason: input.overrideReason ?? null
    }
  };
}

export function evaluateApproval(
  state: ReviewGateState | null,
  repoContext: RepoContext
):
  | { valid: true; approval: ReviewApproval }
  | { valid: false; reason: string } {
  const approval = state?.approval;

  if (!approval) {
    return {
      valid: false,
      reason: 'No pre-implementation review approval found.'
    };
  }

  if (approval.type !== 'pre-implementation-review') {
    return {
      valid: false,
      reason: 'Stored review approval is not a pre-implementation approval.'
    };
  }

  if (
    typeof approval.reviewer !== 'string' ||
    !(SUPPORTED_REVIEWERS as readonly string[]).includes(approval.reviewer)
  ) {
    return {
      valid: false,
      reason: `Stored review approval used unsupported reviewer "${String(approval.reviewer)}".`
    };
  }

  if (typeof approval.expiresAt !== 'string') {
    return {
      valid: false,
      reason: 'Stored review approval has an invalid expiration timestamp.'
    };
  }

  const expiresAtMs = Date.parse(approval.expiresAt);
  if (!Number.isFinite(expiresAtMs)) {
    return {
      valid: false,
      reason: 'Stored review approval has an invalid expiration timestamp.'
    };
  }

  if (Date.now() > expiresAtMs) {
    return {
      valid: false,
      reason: 'Pre-implementation review approval has expired.'
    };
  }

  if (
    approval.branch &&
    repoContext.branch &&
    approval.branch !== repoContext.branch
  ) {
    return {
      valid: false,
      reason:
        'Pre-implementation review approval was granted on a different branch.'
    };
  }

  if (approval.head && repoContext.head && approval.head !== repoContext.head) {
    return {
      valid: false,
      reason:
        'Pre-implementation review approval was granted for a different HEAD commit.'
    };
  }

  return { valid: true, approval };
}
// endregion

// region CLI argument parsing

function parseMaxFilesValue(raw: string | undefined): number {
  const value = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid --max-files value "${raw ?? ''}".`);
  }
  return value;
}

const STRING_FLAG_TO_KEY: Record<string, keyof ParsedReviewGateArgs> = {
  '--reviewer': 'reviewer',
  '--focus': 'focus',
  '--summary': 'summary',
  '--primary-family': 'primaryFamily',
  '--task-size': 'taskSize',
  '--mode': 'mode',
  '--override-reason': 'overrideReason'
};

export function parseArgs(argv: string[]): ParsedReviewGateArgs {
  const parsed: ParsedReviewGateArgs = {
    reviewer: 'copilot-claude',
    focus: 'general',
    summary: 'Approved after pre-implementation review.',
    force: false,
    primaryFamily: null,
    taskSize: null,
    mode: 'standard',
    maxFiles: null,
    overrideReason: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--force') {
      parsed.force = true;
      continue;
    }

    if (current === '--max-files') {
      parsed.maxFiles = parseMaxFilesValue(argv[index + 1]);
      index += 1;
      continue;
    }

    if (current && current in STRING_FLAG_TO_KEY) {
      const next = argv[index + 1];
      if (next !== undefined) {
        (parsed as Record<string, unknown>)[STRING_FLAG_TO_KEY[current]] = next;
      }
      index += 1;
    }
  }

  return parsed;
}
// endregion

// region Hook permission evaluation

export function isMutatingToolUse({ toolName, toolArgs }: HookInput): boolean {
  const normalizedToolName = String(toolName ?? '').toLowerCase();

  if (
    [
      'edit',
      'create',
      'delete',
      'move',
      'rename',
      'replace',
      'write_file'
    ].includes(normalizedToolName)
  ) {
    return true;
  }

  if (!['bash', 'powershell'].includes(normalizedToolName)) {
    return false;
  }

  const command =
    typeof toolArgs === 'string'
      ? toolArgs
      : typeof toolArgs?.command === 'string'
        ? toolArgs.command
        : '';

  if (isReviewGateCommand(command)) {
    return false;
  }

  const trimmedCommand = command.trim();
  if (!trimmedCommand) {
    return false;
  }

  if (hasRiskyShellSyntax(trimmedCommand)) {
    return true;
  }

  // Fail closed: only allow explicitly whitelisted read-only patterns.
  const readOnlyPatterns = [
    /^(Get-Content|type|cat)\b/i,
    /^(Get-ChildItem|ls|dir|tree)\b/i,
    /^(pwd|Get-Location)\b/i,
    /^(rg|findstr|Select-String|wc|head|tail|more|less|sort|uniq|echo|Write-Output|Test-Path|stat|where|Get-Command)\b/i,
    /^git\s+(status|diff|show|log|rev-parse|ls-files)\b/i,
    /^git\s+branch\s+(--show-current|--list|-a|-r)\b/i,
    /^git\s+remote\s+get-url\b/i,
    /^gh\s+(auth\s+status|pr\s+(list|view|status)|repo\s+view|issue\s+view)\b/i,
    /^node(?:\.exe)?\s+(-v|--version|-h|--help)\b/i,
    /^python(?:3)?\s+(-V|--version|-h|--help)\b/i,
    /^pip(?:3)?\s+(--version|help|list|show)\b/i,
    /^poetry\s+(--version|help|show|env\s+list)\b/i,
    /^(npm|pnpm|yarn|bun)\s+(--version|help|list|ls|view|why)\b/i,
    /^npx\s+(-v|--version|-h|--help)\b/i,
    /^(docker|podman)\s+(--version|version|info|images|ps|inspect)\b/i,
    /^go\s+(version|env|list)\b/i,
    /^java\s+-version\b/i,
    /^dotnet\s+(--version|--info|--list-sdks|--list-runtimes)\b/i
  ];

  return !readOnlyPatterns.some((pattern) => pattern.test(trimmedCommand));
}

export function isReviewGateCommand(command: string): boolean {
  const trimmedCommand = command.trim();

  if (hasRiskyShellSyntax(trimmedCommand)) {
    return false;
  }

  if (REVIEW_GATE_SCRIPT_ALIAS_PATTERN.test(trimmedCommand)) {
    return true;
  }

  // Only allow repo-standard Node entrypoints as a complete command so shell
  // chains cannot hide behind an otherwise-valid review-gate path.
  return REVIEW_GATE_ENTRYPOINT_COMMAND_PATTERN.test(trimmedCommand);
}

function hasRiskyShellSyntax(command: string): boolean {
  return RISKY_SHELL_SYNTAX_PATTERNS.some((pattern) => pattern.test(command));
}

export function parseHookInput(rawInput: string): HookInput {
  const input = JSON.parse(rawInput || '{}') as HookInput;
  const rawToolArgs = input.toolArgs;
  let toolArgs: HookInput['toolArgs'] = rawToolArgs;

  if (typeof rawToolArgs === 'string') {
    try {
      toolArgs = JSON.parse(rawToolArgs) as { command?: string };
    } catch {
      toolArgs = { command: rawToolArgs };
    }
  }

  return {
    ...input,
    toolArgs
  };
}

export function evaluateHookPermission(input: {
  hookInput: HookInput;
  repoContext: RepoContext;
  state: ReviewGateState | null;
}): HookPermissionResult {
  if (!isMutatingToolUse(input.hookInput)) {
    return { allow: true };
  }

  const evaluation = evaluateApproval(input.state, input.repoContext);
  if (!evaluation.valid) {
    return {
      allow: false,
      reason: evaluation.reason
    };
  }

  return { allow: true };
}

export function buildDenyPayload(reason: string): string {
  return JSON.stringify({
    permissionDecision: 'deny',
    permissionDecisionReason: `${reason} Pass plan review first (Copilot Claude or Antigravity Gemini 3.5 Flash High fallback), then approve the gate with: node tools/scripts/review-gate/approve-pre-implementation/approve-pre-implementation.ts --reviewer <copilot-claude|gemini-3.5-flash-high|codex-subagent> --focus <area> --summary "<summary>"`
  });
}
// endregion
