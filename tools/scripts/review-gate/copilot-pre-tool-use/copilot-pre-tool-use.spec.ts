// region Imports

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { main } from './copilot-pre-tool-use.ts';
import {
  buildDenyPayload,
  createApproval,
  evaluateHookPermission,
  isMutatingToolUse,
  parseHookInput
} from '../shared/shared.ts';

// endregion

// region Module integrity

test('copilot pre-tool-use entrypoint can be imported without reading stdin', () => {
  assert.equal(typeof main, 'function');
});

// endregion

// region Integration: hook input parsing

test('parseHookInput normalises Copilot tool-use JSON with nested string args', () => {
  const raw = JSON.stringify({
    toolName: 'bash',
    toolArgs: JSON.stringify({ command: 'git apply patch.diff' }),
    cwd: '/workspace'
  });

  const parsed = parseHookInput(raw);

  assert.deepEqual(parsed, {
    toolName: 'bash',
    toolArgs: { command: 'git apply patch.diff' },
    cwd: '/workspace'
  });
});

test('parseHookInput handles plain-string toolArgs from older hook formats', () => {
  const raw = JSON.stringify({
    toolName: 'bash',
    toolArgs: 'echo hello'
  });

  const parsed = parseHookInput(raw);

  assert.deepEqual(parsed, {
    toolName: 'bash',
    toolArgs: { command: 'echo hello' }
  });
});

test('parseHookInput treats empty stdin as an empty object', () => {
  assert.deepEqual(parseHookInput(''), { toolArgs: undefined });
});

test('parseHookInput rejects malformed JSON', () => {
  assert.throws(() => parseHookInput('{broken'), SyntaxError);
});

// endregion

// region Integration: full hook permission flow (the path main() follows)

test('full hook flow allows read-only commands regardless of gate state', () => {
  const hookInput = parseHookInput(
    JSON.stringify({
      toolName: 'read_file',
      toolArgs: { filePath: 'AGENTS.md' }
    })
  );

  // read_file is never mutating
  assert.equal(isMutatingToolUse(hookInput), false);

  const result = evaluateHookPermission({
    hookInput,
    repoContext: {
      root: '/repo',
      branch: 'feature/x',
      head: 'abc123',
      dirty: true,
      gitCommand: 'git'
    },
    state: null
  });

  assert.deepEqual(result, { allow: true });
});

test('full hook flow blocks mutating edit tools when gate has no approval', () => {
  const hookInput = parseHookInput(JSON.stringify({ toolName: 'edit' }));

  assert.equal(isMutatingToolUse(hookInput), true);

  const result = evaluateHookPermission({
    hookInput,
    repoContext: {
      root: '/repo',
      branch: 'feature/x',
      head: 'abc123',
      dirty: false,
      gitCommand: 'git'
    },
    state: null
  });

  assert.deepEqual(result, {
    allow: false,
    reason: 'No pre-implementation review approval found.'
  });
});

test('full hook flow allows mutating commands when a valid approval exists', () => {
  const repoContext = {
    root: '/repo',
    branch: 'feature/x',
    head: 'abc123',
    dirty: false,
    gitCommand: 'git'
  } as const;

  const approval = createApproval({
    reviewer: 'copilot-claude',
    focus: 'general',
    summary: 'Approved after plan review',
    repoContext
  });

  const hookInput = parseHookInput(
    JSON.stringify({
      toolName: 'bash',
      toolArgs: JSON.stringify({ command: 'pnpm install' })
    })
  );

  assert.equal(isMutatingToolUse(hookInput), true);

  const result = evaluateHookPermission({
    hookInput,
    repoContext,
    state: approval
  });

  assert.deepEqual(result, { allow: true });
});

test('full hook flow blocks shell mutations when approval has expired', () => {
  const repoContext = {
    root: '/repo',
    branch: 'feature/x',
    head: 'abc123',
    dirty: false,
    gitCommand: 'git'
  } as const;

  const approval = createApproval({
    reviewer: 'copilot-claude',
    focus: 'general',
    summary: 'Approved after plan review',
    repoContext
  });

  // Simulate an expired approval
  const expiredApproval = {
    ...approval,
    approval: {
      ...approval.approval,
      expiresAt: '2000-01-01T00:00:00.000Z'
    }
  };

  const hookInput = parseHookInput(
    JSON.stringify({
      toolName: 'bash',
      toolArgs: JSON.stringify({ command: 'rm -rf node_modules' })
    })
  );

  const result = evaluateHookPermission({
    hookInput,
    repoContext,
    state: expiredApproval
  });

  assert.deepEqual(result, {
    allow: false,
    reason: 'Pre-implementation review approval has expired.'
  });
});

test('full hook flow allows review-gate commands even without approval', () => {
  const hookInput = parseHookInput(
    JSON.stringify({
      toolName: 'bash',
      toolArgs: JSON.stringify({
        command:
          'node tools/scripts/review-gate/approve-pre-implementation/approve-pre-implementation.ts --reviewer copilot-claude'
      })
    })
  );

  // review-gate commands are exempt from mutating classification
  assert.equal(isMutatingToolUse(hookInput), false);

  const result = evaluateHookPermission({
    hookInput,
    repoContext: {
      root: '/repo',
      branch: 'feature/x',
      head: 'abc123',
      dirty: true,
      gitCommand: 'git'
    },
    state: null
  });

  assert.deepEqual(result, { allow: true });
});

// endregion

// region Integration: deny payload contract

test('buildDenyPayload produces valid JSON with all required fields', () => {
  const payload = JSON.parse(buildDenyPayload('Gate blocked.'));

  assert.equal(payload.permissionDecision, 'deny');
  assert.equal(typeof payload.permissionDecisionReason, 'string');
  assert.match(payload.permissionDecisionReason, /^Gate blocked\./);
  // Must guide the agent through the correct resolution path
  assert.match(payload.permissionDecisionReason, /Copilot/i);
  assert.match(payload.permissionDecisionReason, /Gemini 3\.5 Flash High/i);
  assert.match(payload.permissionDecisionReason, /approve-pre-implementation/);
  // Must include the full set of supported reviewers
  assert.match(payload.permissionDecisionReason, /copilot-claude/);
  assert.match(payload.permissionDecisionReason, /gemini-3\.5-flash-high/);
  assert.match(payload.permissionDecisionReason, /codex-subagent/);
  assert.doesNotMatch(
    payload.permissionDecisionReason,
    /gpt-5-mini/i,
    'Retired reviewer id must not appear in the deny payload.'
  );
});

// endregion
