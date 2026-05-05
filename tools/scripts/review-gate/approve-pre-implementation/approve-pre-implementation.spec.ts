import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('approve-pre-implementation rejects dirty worktrees without force', (context) => {
  const gitProbe = spawnSync('git', ['--version'], { encoding: 'utf8' });
  if (gitProbe.error || gitProbe.status !== 0) {
    context.skip('git is not available in this environment');
    return;
  }

  const repoRoot = mkdtempSync(join(tmpdir(), 'review-gate-approve-spec-'));

  try {
    const initResult = spawnSync('git', ['init'], {
      cwd: repoRoot,
      encoding: 'utf8'
    });
    assert.equal(initResult.status, 0);
    writeFileSync(join(repoRoot, 'dirty.txt'), 'dirty');

    const scriptPath = fileURLToPath(
      new URL('./approve-pre-implementation.ts', import.meta.url)
    );
    const result = spawnSync(
      process.execPath,
      [scriptPath, '--reviewer', 'codex-subagent'],
      {
        cwd: repoRoot,
        encoding: 'utf8'
      }
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Cannot open the pre-implementation gate/);
  } finally {
    rmSync(repoRoot, { force: true, recursive: true });
  }
});
