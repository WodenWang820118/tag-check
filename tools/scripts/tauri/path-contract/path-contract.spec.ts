import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveNxEntrypoint } from './path-contract.ts';

describe('path-contract', () => {
  it('resolves the Nx entrypoint from the workspace root', () => {
    expect(resolveNxEntrypoint('workspace-root')).toBe(
      join('workspace-root', 'node_modules', 'nx', 'bin', 'nx.js')
    );
  });
});
