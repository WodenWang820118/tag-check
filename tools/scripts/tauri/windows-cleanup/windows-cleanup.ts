import { join } from 'node:path';

import { workspaceRoot } from '../path-contract/path-contract.ts';
import { runBestEffort } from '../process-utils/process-utils.ts';

export interface WindowsCleanupDependencies {
  desktopNodePaths?: string[];
  platform?: NodeJS.Platform;
  rootDir?: string;
  runBestEffortFn?: typeof runBestEffort;
}

export function getDefaultDesktopNodePaths(rootDir = workspaceRoot) {
  // Tauri externalBin source files live under src-tauri/binaries, but the running
  // dev/release sidecars are materialized under target/*/node.exe.
  return [
    join(
      rootDir,
      'apps',
      'desktop-tauri',
      'src-tauri',
      'target',
      'debug',
      'node.exe'
    ),
    join(
      rootDir,
      'apps',
      'desktop-tauri',
      'src-tauri',
      'target',
      'release',
      'node.exe'
    )
  ];
}

export function buildStopExistingDesktopSidecarsScript(
  desktopNodePaths: string[]
) {
  return [
    `$paths = @(${desktopNodePaths.map((path) => `'${path.replace(/'/g, "''")}'`).join(', ')})`,
    'Get-CimInstance Win32_Process -ErrorAction SilentlyContinue',
    '  | Where-Object { $_.ExecutablePath -and ($paths -contains $_.ExecutablePath) }',
    '  | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }'
  ].join('\n');
}

export function stopExistingDesktopSidecars(
  dependencies: WindowsCleanupDependencies = {}
) {
  const platform = dependencies.platform ?? process.platform;
  if (platform !== 'win32') {
    return false;
  }

  const rootDir = dependencies.rootDir ?? workspaceRoot;
  const desktopNodePaths =
    dependencies.desktopNodePaths ?? getDefaultDesktopNodePaths(rootDir);
  const runBestEffortFn = dependencies.runBestEffortFn ?? runBestEffort;
  const powerShellScript =
    buildStopExistingDesktopSidecarsScript(desktopNodePaths);

  runBestEffortFn(
    'powershell.exe',
    ['-NoProfile', '-Command', powerShellScript],
    rootDir
  );
  return true;
}
