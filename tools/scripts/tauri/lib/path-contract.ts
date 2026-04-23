import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));

export const workspaceRoot = resolve(scriptDir, '..', '..', '..', '..');
export const binariesDir = join(
  workspaceRoot,
  'apps',
  'desktop-tauri',
  'src-tauri',
  'binaries'
);
export const backendDistDir = join(workspaceRoot, 'dist', 'apps', 'nest-backend');

export function resolveNxEntrypoint(rootDir = workspaceRoot) {
  return join(rootDir, 'node_modules', 'nx', 'bin', 'nx.js');
}

export function resolveNpmEntrypoint(nodeExecPath = process.execPath) {
  return join(
    dirname(nodeExecPath),
    'node_modules',
    'npm',
    'bin',
    'npm-cli.js'
  );
}
