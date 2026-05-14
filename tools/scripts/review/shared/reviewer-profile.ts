import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import type { ReviewCheckpoint } from '../run-checkpoint-review/contracts.ts';

export type ReviewerId =
  | 'architecture-reviewer'
  | 'security-reviewer'
  | 'test-reviewer'
  | 'ux-reviewer';
export type ReviewerProfileProvider = 'codex' | 'copilot' | 'gemini';

export function resolveReviewerId(input: {
  checkpoint: ReviewCheckpoint;
  focus: string;
}): ReviewerId {
  const focus = input.focus.toLowerCase();

  if (
    focus.includes('security') ||
    focus.includes('auth') ||
    focus.includes('secret') ||
    focus.includes('shell') ||
    focus.includes('process') ||
    focus.includes('network') ||
    focus.includes('filesystem') ||
    focus.includes('untrusted')
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

export function buildReviewPromptWithReviewerProfile(input: {
  checkpoint?: ReviewCheckpoint;
  focus?: string;
  prompt: string;
  provider: ReviewerProfileProvider;
  repoRoot?: string;
}): string {
  if (!input.checkpoint || !input.focus) {
    return input.prompt;
  }

  const repoRoot = input.repoRoot ?? process.cwd();
  const reviewerId = resolveReviewerId({
    checkpoint: input.checkpoint,
    focus: input.focus
  });
  const reviewerProfile = readReviewerProfile({
    provider: input.provider,
    repoRoot,
    reviewerId
  });

  if (!reviewerProfile.trim()) {
    return input.prompt;
  }

  return [
    `Use the ${input.provider} reviewer specialist lens: ${reviewerId}.`,
    reviewerProfile.trim(),
    '',
    'Apply this specialist lens together with the shared review contract already included in the review context.',
    '',
    'Review context:',
    input.prompt.trim()
  ].join('\n');
}

export function readReviewerProfile(input: {
  provider: ReviewerProfileProvider;
  repoRoot: string;
  reviewerId: ReviewerId;
}): string {
  for (const profilePath of getReviewerProfilePaths(
    input.provider,
    input.reviewerId
  )) {
    const resolvedPath = path.join(input.repoRoot, profilePath);
    if (!existsSync(resolvedPath)) {
      continue;
    }

    return extractReviewerProfile(readFileSync(resolvedPath, 'utf8'));
  }

  return '';
}

function getReviewerProfilePaths(
  provider: ReviewerProfileProvider,
  reviewerId: ReviewerId
): string[] {
  if (provider === 'codex') {
    return [path.join('.codex', 'agents', `${reviewerId}.toml`)];
  }

  if (provider === 'gemini') {
    return [
      path.join('.gemini', 'commands', 'review', `${reviewerId}.toml`),
      path.join('.github', 'agents', `${reviewerId}.agent.md`)
    ];
  }

  return [path.join('.github', 'agents', `${reviewerId}.agent.md`)];
}

function extractReviewerProfile(source: string): string {
  const tomlField =
    extractTomlMultilineField(source, 'developer_instructions') ||
    extractTomlMultilineField(source, 'prompt') ||
    extractTomlMultilineField(source, 'instructions');

  if (tomlField) {
    return tomlField;
  }

  return stripMarkdownFrontmatter(source).trim();
}

function extractTomlMultilineField(
  source: string,
  fieldName: string
): string | undefined {
  const escapedFieldName = escapeRegExp(fieldName);
  const match = source.match(
    new RegExp(`${escapedFieldName}\\s*=\\s*"""([\\s\\S]*?)"""`)
  );

  return match?.[1]?.trim();
}

function stripMarkdownFrontmatter(source: string): string {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
