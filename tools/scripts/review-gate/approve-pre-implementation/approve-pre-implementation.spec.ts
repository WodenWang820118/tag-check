import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// Git exports GIT_DIR and GIT_INDEX_FILE to hooks, and the pre-commit hook
// runs this spec. With those inherited, `git init` in a temp directory
// re-initialises the repository being committed to instead (from a linked
// worktree that marks the main checkout bare).
function withoutGitEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(env).filter(
      ([name]) => !name.toUpperCase().startsWith('GIT_')
    )
  );
}

function initTempRepo(env: NodeJS.ProcessEnv): string {
  const repoRoot = mkdtempSync(join(tmpdir(), 'review-gate-approve-spec-'));
  const initResult = spawnSync('git', ['init'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: withoutGitEnvironment(env)
  });
  assert.equal(initResult.status, 0, initResult.stderr);
  return repoRoot;
}

function gitIsAvailable(): boolean {
  const gitProbe = spawnSync('git', ['--version'], { encoding: 'utf8' });
  return !gitProbe.error && gitProbe.status === 0;
}

test('approve-pre-implementation rejects dirty worktrees without force', (context) => {
  if (!gitIsAvailable()) {
    context.skip('git is not available in this environment');
    return;
  }

  const repoRoot = initTempRepo(process.env);

  try {
    writeFileSync(join(repoRoot, 'dirty.txt'), 'dirty');

    const scriptPath = fileURLToPath(
      new URL('./approve-pre-implementation.ts', import.meta.url)
    );
    const result = spawnSync(
      process.execPath,
      [scriptPath, '--reviewer', 'codex-subagent'],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: withoutGitEnvironment(process.env)
      }
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Cannot open the pre-implementation gate/);
  } finally {
    rmSync(repoRoot, { force: true, recursive: true });
  }
});

test('the temp repository ignores a repository inherited from a git hook', (context) => {
  if (!gitIsAvailable()) {
    context.skip('git is not available in this environment');
    return;
  }

  const hookRepo = initTempRepo(process.env);
  const hookGitDir = join(hookRepo, '.git');
  let repoRoot: string | undefined;

  try {
    repoRoot = initTempRepo({
      ...process.env,
      GIT_DIR: hookGitDir,
      GIT_INDEX_FILE: join(hookGitDir, 'index')
    });

    assert.ok(
      existsSync(join(repoRoot, '.git')),
      'git init must create its own repository in the temp directory'
    );
  } finally {
    rmSync(hookRepo, { force: true, recursive: true });
    if (repoRoot) rmSync(repoRoot, { force: true, recursive: true });
  }
});
