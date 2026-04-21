import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const REVIEW_TTL_MS = 2 * 60 * 60 * 1000;

export const SUPPORTED_REVIEWERS = [
  'copilot-claude',
  'copilot-gpt-5-mini',
  'gemini-2.5-pro',
  'codex-subagent'
] as const;

export type SupportedReviewer = (typeof SUPPORTED_REVIEWERS)[number];

export interface RepoContext {
  root: string;
  branch: string | null;
  head: string | null;
  dirty: boolean | null;
  gitCommand: string | null;
}

export interface ReviewApproval {
  type: 'pre-implementation-review';
  reviewer: SupportedReviewer;
  focus: string;
  summary: string;
  approvedAt: string;
  expiresAt: string;
  branch: string | null;
  head: string | null;
  root: string;
}

export interface ReviewGateState {
  version: 1;
  approval: ReviewApproval;
}

export interface ParsedReviewGateArgs {
  reviewer: string;
  focus: string;
  summary: string;
  force: boolean;
}

interface HookInput {
  cwd?: string;
  toolArgs?: { command?: string } | string;
  toolName?: string;
}

export interface HookPermissionResult {
  allow: boolean;
  reason?: string;
}

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

export function validateReviewerId(reviewer: string): SupportedReviewer {
  if ((SUPPORTED_REVIEWERS as readonly string[]).includes(reviewer)) {
    return reviewer as SupportedReviewer;
  }

  throw new Error(
    `Unsupported reviewer "${reviewer}". Expected one of: ${SUPPORTED_REVIEWERS.join(', ')}.`
  );
}

export function createApproval(input: {
  reviewer: SupportedReviewer;
  focus: string;
  summary: string;
  repoContext: RepoContext;
}): ReviewGateState {
  const approvedAt = new Date().toISOString();
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
      root: input.repoContext.root
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
    approval.reviewer &&
    !(SUPPORTED_REVIEWERS as readonly string[]).includes(approval.reviewer)
  ) {
    return {
      valid: false,
      reason: `Stored review approval used unsupported reviewer "${approval.reviewer}".`
    };
  }

  if (approval.expiresAt && Date.now() > Date.parse(approval.expiresAt)) {
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

export function parseArgs(argv: string[]): ParsedReviewGateArgs {
  const parsed: ParsedReviewGateArgs = {
    reviewer: 'copilot-claude',
    focus: 'general',
    summary: 'Approved after pre-implementation review.',
    force: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--reviewer') {
      parsed.reviewer = argv[index + 1] ?? parsed.reviewer;
      index += 1;
      continue;
    }

    if (current === '--focus') {
      parsed.focus = argv[index + 1] ?? parsed.focus;
      index += 1;
      continue;
    }

    if (current === '--summary') {
      parsed.summary = argv[index + 1] ?? parsed.summary;
      index += 1;
      continue;
    }

    if (current === '--force') {
      parsed.force = true;
    }
  }

  return parsed;
}

export function isMutatingToolUse({ toolName, toolArgs }: HookInput): boolean {
  const normalizedToolName = String(toolName ?? '').toLowerCase();

  if (
    ['edit', 'create', 'delete', 'move', 'rename'].includes(normalizedToolName)
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

  const riskyShellSyntaxPatterns = [
    />{1,2}\s*\S/,
    /<{1,2}\s*\S/,
    /(^|[\s)])(&&|\|\||;)(?=\s|$)/,
    /\|(?!\|)/,
    /\$\(/,
    /`[^`]+`/,
    /\b(powershell|pwsh)\b.*\s-(EncodedCommand|enc|e)\b/i
  ];

  if (
    riskyShellSyntaxPatterns.some((pattern) => pattern.test(trimmedCommand))
  ) {
    return true;
  }

  // Fail closed for anything that is not on the read-only allowlist.
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
  return (
    /review-gate[\\/](approve-pre-implementation|status|reset)\.ts/i.test(
      command
    ) || /\breview:(approve-pre-implementation|status|reset)\b/i.test(command)
  );
}

export function parseHookInput(rawInput: string): HookInput {
  const input = JSON.parse(rawInput || '{}') as HookInput;
  let toolArgs = input.toolArgs;

  if (typeof toolArgs === 'string') {
    try {
      toolArgs = JSON.parse(toolArgs) as { command?: string };
    } catch {
      toolArgs = { command: toolArgs };
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
    permissionDecisionReason: `${reason} Use GitHub Copilot Claude to review the plan first, Gemini 2.5 Pro if the Claude path is unavailable, Copilot GPT-5 mini if Gemini is unavailable or you explicitly need the Copilot fallback path, or the Codex reviewer subagent if both local CLIs are unavailable, then run: node --experimental-strip-types scripts/review-gate/approve-pre-implementation.ts --reviewer <copilot-claude|copilot-gpt-5-mini|gemini-2.5-pro|codex-subagent> --focus general --summary "Approved after plan review".`
  });
}
