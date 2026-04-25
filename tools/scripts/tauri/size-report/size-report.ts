import { existsSync, lstatSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { isDirectEntrypoint } from '../../shared/paths.ts';
import { workspaceRoot } from '../path-contract/path-contract.ts';

interface SizeEntry {
  bytes: number | null;
  label: string;
  path: string;
}

interface DirectorySizeEntry {
  bytes: number;
  name: string;
  path: string;
}

const releaseDir = join(
  workspaceRoot,
  'apps',
  'desktop-tauri',
  'src-tauri',
  'target',
  'release'
);
const frontendDistDir = join(
  workspaceRoot,
  'dist',
  'apps',
  'ng-frontend',
  'browser'
);
const backendNodeModulesDir = join(releaseDir, 'backend', 'node_modules');

function formatBytes(bytes: number | null) {
  if (bytes === null) {
    return 'missing';
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getFileSize(targetPath: string): number | null {
  if (!existsSync(targetPath)) {
    return null;
  }

  return statSync(targetPath).size;
}

function getDirectorySize(targetPath: string): number | null {
  if (!existsSync(targetPath)) {
    return null;
  }

  if (lstatSync(targetPath).isSymbolicLink()) {
    return 0;
  }

  let total = 0;
  const entries = readdirSync(targetPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = join(targetPath, entry.name);
    const entryStats = lstatSync(entryPath);

    if (entryStats.isSymbolicLink()) {
      continue;
    }

    if (entryStats.isDirectory()) {
      total += getDirectorySize(entryPath) ?? 0;
      continue;
    }

    if (entryStats.isFile()) {
      total += entryStats.size;
    }
  }

  return total;
}

function findLargestInstaller(): string | null {
  const nsisDir = join(releaseDir, 'bundle', 'nsis');

  if (!existsSync(nsisDir)) {
    return null;
  }

  const installers = readdirSync(nsisDir)
    .filter((fileName) => fileName.toLowerCase().endsWith('.exe'))
    .map((fileName) => join(nsisDir, fileName))
    .sort(
      (left, right) => (getFileSize(right) ?? 0) - (getFileSize(left) ?? 0)
    );

  return installers[0] ?? null;
}

function getTopNodeModuleSizes(limit = 10): DirectorySizeEntry[] {
  if (!existsSync(backendNodeModulesDir)) {
    return [];
  }

  return readdirSync(backendNodeModulesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const path = join(backendNodeModulesDir, entry.name);

      return {
        bytes: getDirectorySize(path) ?? 0,
        name: entry.name,
        path
      };
    })
    .sort((left, right) => right.bytes - left.bytes)
    .slice(0, limit);
}

function buildSizeEntries(): SizeEntry[] {
  const installerPath = findLargestInstaller();

  return [
    {
      bytes: installerPath ? getFileSize(installerPath) : null,
      label: 'NSIS installer',
      path: installerPath ?? join(releaseDir, 'bundle', 'nsis')
    },
    {
      bytes: getFileSize(join(releaseDir, 'desktop-tauri.exe')),
      label: 'Tauri app exe',
      path: join(releaseDir, 'desktop-tauri.exe')
    },
    {
      bytes: getFileSize(join(releaseDir, 'node.exe')),
      label: 'Bundled Node sidecar',
      path: join(releaseDir, 'node.exe')
    },
    {
      bytes: getDirectorySize(frontendDistDir),
      label: 'Frontend dist',
      path: frontendDistDir
    },
    {
      bytes: getDirectorySize(backendNodeModulesDir),
      label: 'Backend node_modules',
      path: backendNodeModulesDir
    }
  ];
}

export function main() {
  console.log('Tauri size report');
  console.log('');

  for (const entry of buildSizeEntries()) {
    console.log(`${entry.label}: ${formatBytes(entry.bytes)}`);
    console.log(`  ${entry.path}`);
  }

  const topModules = getTopNodeModuleSizes();

  if (topModules.length > 0) {
    console.log('');
    console.log('Largest backend runtime dependencies:');

    for (const entry of topModules) {
      console.log(`${formatBytes(entry.bytes).padStart(10)}  ${entry.name}`);
    }

    console.log('');
    console.log(
      'V2 candidates: review these dependencies before removing or splitting them; v1 keeps runtime contents unchanged.'
    );
  }
}

if (isDirectEntrypoint(import.meta.url)) {
  main();
}
