import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

describe('process-utils', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.doUnmock('node:child_process');
    vi.doUnmock('node:fs');
  });

  it('removes an existing path recursively', async () => {
    const existsSync = vi.fn(() => true);
    const rmSync = vi.fn();

    vi.doMock('node:fs', () => ({
      existsSync,
      rmSync
    }));

    const { rmIfExists } = await import('./process-utils.ts');

    rmIfExists('target-path');

    expect(existsSync).toHaveBeenCalledWith('target-path');
    expect(rmSync).toHaveBeenCalledWith('target-path', {
      force: true,
      recursive: true
    });
  });

  it('skips removal when the path does not exist', async () => {
    const existsSync = vi.fn(() => false);
    const rmSync = vi.fn();

    vi.doMock('node:fs', () => ({
      existsSync,
      rmSync
    }));

    const { rmIfExists } = await import('./process-utils.ts');

    rmIfExists('missing-path');

    expect(existsSync).toHaveBeenCalledWith('missing-path');
    expect(rmSync).not.toHaveBeenCalled();
  });

  it('runs commands through spawnSync when the process succeeds', async () => {
    const spawnSync = vi.fn(() => ({
      error: undefined,
      status: 0
    }));

    vi.doMock('node:child_process', () => ({
      spawnSync
    }));

    const { run } = await import('./process-utils.ts');

    expect(() => run('node.exe', ['task.js'], 'workspace-root')).not.toThrow();
    expect(spawnSync).toHaveBeenCalledWith('node.exe', ['task.js'], {
      cwd: 'workspace-root',
      shell: false,
      stdio: 'inherit'
    });
  });

  it('throws a command failure error when the process exits non-zero', async () => {
    const spawnSync = vi.fn(() => ({
      error: undefined,
      status: 1
    }));

    vi.doMock('node:child_process', () => ({
      spawnSync
    }));

    const { run } = await import('./process-utils.ts');

    expect(() => run('node.exe', ['task.js'], 'workspace-root')).toThrow(
      'Command failed: node.exe task.js'
    );
  });

  it('returns false from tryRun when spawnSync reports an error', async () => {
    const spawnSync = vi.fn(() => ({
      error: new Error('spawn failed'),
      status: null
    }));

    vi.doMock('node:child_process', () => ({
      spawnSync
    }));

    const { tryRun } = await import('./process-utils.ts');

    expect(tryRun('node.exe', ['task.js'], 'workspace-root')).toBe(false);
    expect(spawnSync).toHaveBeenCalledWith('node.exe', ['task.js'], {
      cwd: 'workspace-root',
      shell: false,
      stdio: 'inherit'
    });
  });

  it('returns true from tryRun when the process exits cleanly', async () => {
    const spawnSync = vi.fn(() => ({
      error: undefined,
      status: 0
    }));

    vi.doMock('node:child_process', () => ({
      spawnSync
    }));

    const { tryRun } = await import('./process-utils.ts');

    expect(tryRun('node.exe', ['task.js'], 'workspace-root')).toBe(true);
  });

  it('returns false from tryRun when the process exits non-zero', async () => {
    const spawnSync = vi.fn(() => ({
      error: undefined,
      status: 1
    }));

    vi.doMock('node:child_process', () => ({
      spawnSync
    }));

    const { tryRun } = await import('./process-utils.ts');

    expect(tryRun('node.exe', ['task.js'], 'workspace-root')).toBe(false);
  });

  it('never throws from runBestEffort and uses ignored stdio', async () => {
    const spawnSync = vi.fn(() => ({
      error: new Error('spawn failed'),
      status: 1
    }));

    vi.doMock('node:child_process', () => ({
      spawnSync
    }));

    const { runBestEffort } = await import('./process-utils.ts');

    expect(() =>
      runBestEffort('powershell.exe', ['-NoProfile'], 'workspace-root')
    ).not.toThrow();
    expect(spawnSync).toHaveBeenCalledWith('powershell.exe', ['-NoProfile'], {
      cwd: 'workspace-root',
      shell: false,
      stdio: 'ignore'
    });
  });

  it('stays silent when runBestEffort succeeds', async () => {
    const spawnSync = vi.fn(() => ({
      error: undefined,
      status: 0
    }));

    vi.doMock('node:child_process', () => ({
      spawnSync
    }));

    const { runBestEffort } = await import('./process-utils.ts');

    expect(() =>
      runBestEffort('powershell.exe', ['-NoProfile'], 'workspace-root')
    ).not.toThrow();
  });
});

describe('path-contract', () => {
  it('resolves the Nx entrypoint from the workspace root', async () => {
    const { resolveNxEntrypoint } = await import('./path-contract.ts');

    expect(resolveNxEntrypoint('workspace-root')).toBe(
      join('workspace-root', 'node_modules', 'nx', 'bin', 'nx.js')
    );
  });

  it('resolves the npm CLI entrypoint relative to the Node executable', async () => {
    const { resolveNpmEntrypoint } = await import('./path-contract.ts');

    expect(resolveNpmEntrypoint(join('workspace-root', 'node.exe'))).toBe(
      join('workspace-root', 'node_modules', 'npm', 'bin', 'npm-cli.js')
    );
  });
});
