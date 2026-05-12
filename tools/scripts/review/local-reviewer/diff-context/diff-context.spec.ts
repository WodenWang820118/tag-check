import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCheckpointReviewContext } from './diff-context.ts';

test('buildCheckpointReviewContext includes an explicit changed files section before the diff', () => {
  const context = buildCheckpointReviewContext({
    changedFiles: ['apps/law-prep-web/src/app/app.component.ts'],
    diffText:
      'diff --git a/apps/law-prep-web/src/app/app.component.ts b/apps/law-prep-web/src/app/app.component.ts',
    sample: {
      baseRef: 'abc123',
      commit: 'def456',
      committedAtEpoch: 0,
      fileCount: 1,
      kind: 'small-ts',
      repoName: 'gx.law-prep',
      repoRoot: 'C:/software-dev/gx.law-prep',
      subject: 'Update copy',
      totalChangedLines: 4,
    },
  });

  assert.match(
    context,
    /Changed files:\n- apps\/law-prep-web\/src\/app\/app\.component\.ts\n\nDiff to review:/,
  );
});

test('buildCheckpointReviewContext preserves the section shape for empty changed files', () => {
  const context = buildCheckpointReviewContext({
    changedFiles: [],
    diffText: '',
    sample: {
      baseRef: 'abc123',
      commit: 'def456',
      committedAtEpoch: 0,
      fileCount: 0,
      kind: 'general',
      repoName: 'gx.law-prep',
      repoRoot: 'C:/software-dev/gx.law-prep',
      subject: 'Empty diff',
      totalChangedLines: 0,
    },
  });

  assert.match(context, /Changed files:\n\nDiff to review:\n$/);
});
