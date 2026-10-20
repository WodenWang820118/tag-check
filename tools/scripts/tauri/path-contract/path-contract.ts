import { readFileSync } from 'node:fs';
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

/**
 * The Nx CLI script, read from the `bin` field of Nx's package.json. Nx 23
 * moved it from `bin/nx.js` to `dist/bin/nx.js`.
 */
export function resolveNxEntrypoint(rootDir = workspaceRoot) {
  const packageDir = join(rootDir, 'node_modules', 'nx');
  const { bin } = JSON.parse(
    readFileSync(join(packageDir, 'package.json'), 'utf8')
  ) as { bin: string | Record<string, string> };
  return join(packageDir, typeof bin === 'string' ? bin : bin['nx']);
}
