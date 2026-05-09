import { describe, expect, it, vi } from 'vitest';
import {
  buildStopExistingDesktopSidecarsScript,
  getDefaultDesktopNodePaths,
  stopExistingDesktopSidecars
} from './windows-cleanup.ts';

describe('getDefaultDesktopNodePaths', () => {
  it('returns the debug and release node.exe paths under desktop-tauri target', () => {
    const paths = getDefaultDesktopNodePaths('/root');
    expect(paths).toHaveLength(2);
    expect(paths[0]).toMatch(/debug/);
    expect(paths[1]).toMatch(/release/);
    expect(paths[0]).toMatch(/node\.exe$/);
    expect(paths[1]).toMatch(/node\.exe$/);
    for (const path of paths) {
      expect(path).toContain('apps');
      expect(path).toContain('desktop-tauri');
      expect(path).toContain('src-tauri');
    }
  });
});

describe('buildStopExistingDesktopSidecarsScript', () => {
  it('emits a quoted PowerShell array of the supplied paths', () => {
    const script = buildStopExistingDesktopSidecarsScript([
      'C:\\a\\node.exe',
      "C:\\b\\with'apostrophe.exe"
    ]);
    expect(script).toContain("'C:\\a\\node.exe'");
    // single quotes inside paths must be doubled per PowerShell quoting rules
    expect(script).toContain("'C:\\b\\with''apostrophe.exe'");
    expect(script).toContain('Get-CimInstance Win32_Process');
    expect(script).toContain('Stop-Process');
  });

  it('produces an empty array literal when no paths are provided', () => {
    expect(buildStopExistingDesktopSidecarsScript([])).toContain(
      '$paths = @()'
    );
  });
});

describe('stopExistingDesktopSidecars', () => {
  it('returns false and does nothing on non-win32 platforms', () => {
    const runBestEffortFn = vi.fn();
    const result = stopExistingDesktopSidecars({
      platform: 'linux',
      runBestEffortFn
    });
    expect(result).toBe(false);
    expect(runBestEffortFn).not.toHaveBeenCalled();
  });

  it('invokes powershell with the cleanup script on win32', () => {
    const runBestEffortFn = vi.fn();
    const result = stopExistingDesktopSidecars({
      platform: 'win32',
      rootDir: '/root',
      desktopNodePaths: ['C:\\a\\node.exe'],
      runBestEffortFn
    });
    expect(result).toBe(true);
    expect(runBestEffortFn).toHaveBeenCalledTimes(1);
    const [command, args, cwd] = runBestEffortFn.mock.calls[0];
    expect(command).toBe('powershell.exe');
    expect(args[0]).toBe('-NoProfile');
    expect(args[1]).toBe('-Command');
    expect(args[2]).toContain("'C:\\a\\node.exe'");
    expect(cwd).toBe('/root');
  });
});
