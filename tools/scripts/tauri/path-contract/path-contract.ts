import { join } from 'node:path';

import { resolveWorkspaceRootFromModuleUrl } from '../../shared/paths.ts';

export const workspaceRoot = resolveWorkspaceRootFromModuleUrl(
  import.meta.url,
  4
);
export const binariesDir = join(
  workspaceRoot,
  'apps',
  'desktop-tauri',
  'src-tauri',
  'binaries'
);
export const backendDistDir = join(
  workspaceRoot,
  'dist',
  'apps',
  'nest-backend'
);

export function resolveNxEntrypoint(rootDir = workspaceRoot) {
  return join(rootDir, 'node_modules', 'nx', 'bin', 'nx.js');
}
