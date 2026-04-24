import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveNpmEntrypoint, resolveNxEntrypoint } from './path-contract.ts';

describe('path-contract', () => {
  it('resolves the Nx entrypoint from the workspace root', () => {
    expect(resolveNxEntrypoint('workspace-root')).toBe(
      join('workspace-root', 'node_modules', 'nx', 'bin', 'nx.js')
    );
  });

  it('resolves the npm CLI entrypoint relative to the Node executable', () => {
    expect(resolveNpmEntrypoint(join('workspace-root', 'node.exe'))).toBe(
      join('workspace-root', 'node_modules', 'npm', 'bin', 'npm-cli.js')
    );
  });
});
