import assert from 'node:assert/strict';
import test from 'node:test';

import { extractCodexAgentMessage, resolveCodexReviewerId } from './codex.ts';

test('resolveCodexReviewerId routes checkpoints and focus to the expected reviewer', () => {
  assert.equal(
    resolveCodexReviewerId({
      checkpoint: 'plan',
      focus: 'general',
    }),
    'architecture-reviewer',
  );

  assert.equal(
    resolveCodexReviewerId({
      checkpoint: 'implementation',
      focus: 'security',
    }),
    'security-reviewer',
  );

  assert.equal(
    resolveCodexReviewerId({
      checkpoint: 'test',
      focus: 'tests',
    }),
    'test-reviewer',
  );

  assert.equal(
    resolveCodexReviewerId({
      checkpoint: 'implementation',
      focus: 'ux accessibility',
    }),
    'ux-reviewer',
  );
});

test('extractCodexAgentMessage returns the last completed agent message from JSONL output', () => {
  const output = [
    '{"type":"thread.started","thread_id":"1"}',
    '{"type":"item.completed","item":{"id":"a","type":"agent_message","text":"First"}}',
    '2026-04-17T10:00:00Z WARN something noisy',
    '{"type":"item.completed","item":{"id":"b","type":"agent_message","text":"Final"}}',
  ].join('\n');

  assert.equal(extractCodexAgentMessage(output), 'Final');
});
