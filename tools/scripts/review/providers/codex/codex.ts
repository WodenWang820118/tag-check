import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  cacheProviderHealth,
  getCachedProviderHealth,
  type ReviewProviderHealthResult
} from '../../provider-health/provider-health.ts';
import { runLocalCliCommand } from '../local-cli/local-cli.ts';

type ReviewCheckpoint = 'plan' | 'implementation' | 'test' | 'pre-merge';
type CodexReviewerId =
  | 'architecture-reviewer'
  | 'security-reviewer'
  | 'test-reviewer'
  | 'ux-reviewer';

interface CodexReviewInput {
  checkpoint: ReviewCheckpoint;
  focus: string;
  model?: string;
  prompt: string;
  repoRoot?: string;
}

const CODEX_HEALTH_TIMEOUT_MS = 15000;
const CODEX_REVIEW_TIMEOUT_MS = 3 * 60 * 1000;

export function probeCodexCliHealth(
  input: {
    model?: string;
    repoRoot?: string;
  } = {}
): ReviewProviderHealthResult {
  const repoRoot = input.repoRoot ?? process.cwd();
  const cached = getCachedProviderHealth('codex', undefined, repoRoot);
  if (cached) {
    return cached;
  }

  const checkedAtMs = Date.now();
  const versionResult = runLocalCliCommand({
    command: 'codex',
    args: ['--version'],
    cwd: repoRoot,
    timeoutMs: CODEX_HEALTH_TIMEOUT_MS
  });

  if (versionResult.error || versionResult.status !== 0) {
    return cacheProviderHealth(
      'codex',
      undefined,
      {
        available: false,
        checkedAtMs,
        reason: 'Codex CLI is not installed or cannot be started locally.'
      },
      repoRoot
    );
  }

  const loginResult = runLocalCliCommand({
    command: 'codex',
    args: ['login', 'status'],
    cwd: repoRoot,
    timeoutMs: CODEX_HEALTH_TIMEOUT_MS
  });

  const loginOutput = joinOutput(loginResult.stdout, loginResult.stderr);
  if (
    loginResult.error ||
    loginResult.status !== 0 ||
    !/logged in/i.test(loginOutput)
  ) {
    return cacheProviderHealth(
      'codex',
      undefined,
      {
        available: false,
        checkedAtMs,
        reason:
          loginOutput || 'Codex CLI is installed locally but is not logged in.'
      },
      repoRoot
    );
  }

  return cacheProviderHealth(
    'codex',
    undefined,
    {
      available: true,
      checkedAtMs
    },
    repoRoot
  );
}

export function isCodexUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /\b(login|logged out|authenticate|not authenticated|quota|billing|429|rate limit|subscription|required)\b/i.test(
    error.message
  );
}

export function resolveCodexReviewerId(input: {
  checkpoint: ReviewCheckpoint;
  focus: string;
}): CodexReviewerId {
  const focus = input.focus.toLowerCase();

  if (
    focus.includes('security') ||
    focus.includes('auth') ||
    focus.includes('secret') ||
    focus.includes('shell') ||
    focus.includes('network') ||
    focus.includes('filesystem')
  ) {
    return 'security-reviewer';
  }

  if (input.checkpoint === 'test' || focus.includes('test')) {
    return 'test-reviewer';
  }

  if (
    focus.includes('ux') ||
    focus.includes('ui') ||
    focus.includes('accessibility') ||
    focus.includes('responsive')
  ) {
    return 'ux-reviewer';
  }

  return 'architecture-reviewer';
}

export function runCodexReview(input: CodexReviewInput): string {
  const repoRoot = input.repoRoot ?? process.cwd();
  const reviewerId = resolveCodexReviewerId({
    checkpoint: input.checkpoint,
    focus: input.focus
  });
  const prompt = buildCodexReviewPrompt({
    prompt: input.prompt,
    reviewerId,
    repoRoot
  });

  const args = ['exec', 'review', '--ephemeral', '--json', '-'];
  if (input.model) {
    args.splice(2, 0, '--model', input.model);
  }

  const result = runLocalCliCommand({
    command: 'codex',
    args,
    cwd: repoRoot,
    input: prompt,
    timeoutMs: CODEX_REVIEW_TIMEOUT_MS
  });

  const stderr = result.stderr ?? '';
  if (result.error || result.status !== 0) {
    throw new Error(
      stderr.trim() || result.error?.message || 'Codex review command failed.'
    );
  }

  const output = extractCodexAgentMessage(result.stdout ?? '');
  if (!output.trim()) {
    throw new Error(stderr.trim() || 'Codex review returned no agent message.');
  }

  return output.trim();
}

function buildCodexReviewPrompt(input: {
  prompt: string;
  repoRoot: string;
  reviewerId: CodexReviewerId;
}): string {
  const reviewerInstructions = readCodexReviewerInstructions(
    input.reviewerId,
    input.repoRoot
  );

  return [
    `Use the local Codex reviewer profile: ${input.reviewerId}.`,
    reviewerInstructions,
    '',
    'Apply the reviewer profile exactly.',
    'Start with findings ordered by severity.',
    'If there are no material issues, say so explicitly and note residual risks.',
    '',
    'Context to review:',
    input.prompt.trim()
  ].join('\n');
}

function readCodexReviewerInstructions(
  reviewerId: CodexReviewerId,
  repoRoot: string
): string {
  const reviewerPath = path.join(
    repoRoot,
    '.codex',
    'agents',
    `${reviewerId}.toml`
  );
  const source = readFileSync(reviewerPath, 'utf8');
  const match = source.match(/developer_instructions = """([\s\S]*?)"""/);

  if (!match) {
    throw new Error(
      `Unable to read Codex reviewer instructions: ${reviewerId}`
    );
  }

  return match[1].trim();
}

export function extractCodexAgentMessage(output: string): string {
  let lastMessage = '';

  for (const line of output.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) {
      continue;
    }

    try {
      const parsed = JSON.parse(trimmed) as {
        item?: { text?: string; type?: string };
        type?: string;
      };

      if (
        parsed.type === 'item.completed' &&
        parsed.item?.type === 'agent_message' &&
        typeof parsed.item.text === 'string'
      ) {
        lastMessage = parsed.item.text;
      }
    } catch {
      continue;
    }
  }

  return lastMessage;
}

function joinOutput(stdout?: string | null, stderr?: string | null): string {
  return [stdout, stderr].filter(Boolean).join('\n').trim();
}
