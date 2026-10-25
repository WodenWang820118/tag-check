import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { findNodeTestSpecs } from './node-test-specs.ts';

// Built at runtime so this Vitest spec is not itself selected as a node:test spec.
const NODE_TEST_MODULE = ['node', 'test'].join(':');

describe('findNodeTestSpecs', () => {
  let rootDir = '';

  function writeSpec(relativePath: string, content: string): void {
    const file = join(rootDir, relativePath);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content, 'utf8');
  }

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), 'node-test-specs-'));
  });

  afterEach(() => {
    rmSync(rootDir, { recursive: true, force: true });
  });

  it('selects only tools specs that import node:test', () => {
    writeSpec(
      'tools/scripts/b/b.spec.ts',
      `import test from '${NODE_TEST_MODULE}';\ntest('b', () => {});\n`
    );
    writeSpec(
      'tools/scripts/a/nested/a.spec.ts',
      `import { describe, it } from "${NODE_TEST_MODULE}";\n`
    );
    writeSpec(
      'tools/scripts/c/c.spec.ts',
      "import { describe } from 'vitest';\n"
    );
    writeSpec(
      'tools/scripts/d/d.ts',
      `import test from '${NODE_TEST_MODULE}';\n`
    );
    writeSpec('libs/x/x.spec.ts', `import test from '${NODE_TEST_MODULE}';\n`);

    expect(findNodeTestSpecs(rootDir)).toEqual([
      'tools/scripts/a/nested/a.spec.ts',
      'tools/scripts/b/b.spec.ts'
    ]);
  });

  it('returns no specs when none import node:test', () => {
    writeSpec('tools/scripts/c/c.spec.ts', "it('c', () => {});\n");

    expect(findNodeTestSpecs(rootDir)).toEqual([]);
  });
});
