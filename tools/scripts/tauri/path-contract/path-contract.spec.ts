import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveNxEntrypoint, workspaceRoot } from './path-contract.ts';

describe('path-contract', () => {
  it("resolves the Nx entrypoint from the bin field of Nx's package.json", () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'tag-check-nx-bin-'));
    try {
      const packageDir = join(rootDir, 'node_modules', 'nx');
      mkdirSync(packageDir, { recursive: true });
      writeFileSync(
        join(packageDir, 'package.json'),
        JSON.stringify({ bin: { nx: './dist/bin/nx.js' } })
      );

      expect(resolveNxEntrypoint(rootDir)).toBe(
        join(packageDir, 'dist', 'bin', 'nx.js')
      );
    } finally {
      rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it('points at a file in the installed Nx', () => {
    expect(existsSync(resolveNxEntrypoint(workspaceRoot))).toBe(true);
  });
});
