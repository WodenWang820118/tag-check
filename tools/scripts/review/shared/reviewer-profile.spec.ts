import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'vitest';

import {
  buildReviewPromptWithReviewerProfile,
  readReviewerProfile,
  resolveReviewerId
} from './reviewer-profile.ts';

test('resolveReviewerId maps checkpoint and focus to specialist reviewers', () => {
  assert.equal(
    resolveReviewerId({ checkpoint: 'plan', focus: 'contracts' }),
    'architecture-reviewer'
  );
  assert.equal(
    resolveReviewerId({ checkpoint: 'implementation', focus: 'shell process' }),
    'security-reviewer'
  );
  assert.equal(
    resolveReviewerId({ checkpoint: 'test', focus: 'coverage' }),
    'test-reviewer'
  );
  assert.equal(
    resolveReviewerId({ checkpoint: 'implementation', focus: 'ui responsive' }),
    'ux-reviewer'
  );
});

test('readReviewerProfile prefers Gemini commands and falls back to GitHub agent profiles', () => {
  const repoRoot = makeTempRepo();
  try {
    writeProfile(
      repoRoot,
      path.join('.github', 'agents', 'security-reviewer.agent.md'),
      ['---', 'name: security-reviewer', '---', 'fallback profile'].join('\n')
    );
    assert.equal(
      readReviewerProfile({
        provider: 'gemini',
        repoRoot,
        reviewerId: 'security-reviewer'
      }),
      'fallback profile'
    );

    writeProfile(
      repoRoot,
      path.join('.gemini', 'commands', 'review', 'security-reviewer.toml'),
      'developer_instructions = """\nGemini profile\n"""\n'
    );
    assert.equal(
      readReviewerProfile({
        provider: 'gemini',
        repoRoot,
        reviewerId: 'security-reviewer'
      }),
      'Gemini profile'
    );
  } finally {
    rmSync(repoRoot, { force: true, recursive: true });
  }
});

test('buildReviewPromptWithReviewerProfile wraps checkpoint prompts with the active profile', () => {
  const repoRoot = makeTempRepo();
  try {
    writeProfile(
      repoRoot,
      path.join('.github', 'agents', 'architecture-reviewer.agent.md'),
      [
        '---',
        'name: architecture-reviewer',
        '---',
        'Architecture profile'
      ].join('\n')
    );

    const prompt = buildReviewPromptWithReviewerProfile({
      checkpoint: 'plan',
      focus: 'general',
      prompt: 'Review context',
      provider: 'copilot',
      repoRoot
    });

    assert.match(
      prompt,
      /Use the copilot reviewer specialist lens: architecture-reviewer/
    );
    assert.match(prompt, /Architecture profile/);
    assert.match(prompt, /shared review contract already included/);
    assert.match(prompt, /Review context/);
  } finally {
    rmSync(repoRoot, { force: true, recursive: true });
  }
});

function makeTempRepo(): string {
  return mkdtempSync(path.join(tmpdir(), 'reviewer-profile-'));
}

function writeProfile(
  repoRoot: string,
  relativePath: string,
  source: string
): void {
  const filePath = path.join(repoRoot, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, source, 'utf8');
}
