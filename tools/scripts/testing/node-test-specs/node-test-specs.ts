/**
 * Runs the tools specs written for Node's built-in test runner.
 *
 * Tools specs that import `node:test` run with `node --test`; every other
 * tools spec runs in the Vitest `tools` project (`vitest.config.ts`), which
 * excludes these files with the same selection.
 *
 * Usage: node tools/scripts/testing/node-test-specs/node-test-specs.ts [node --test options]
 */
import { spawnSync } from 'node:child_process';
import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { isDirectEntrypoint, normalizeToolPath } from '../../shared/paths.ts';

export const TOOLS_SPECS_GLOB = 'tools/scripts/**/*.spec.ts';

const NODE_TEST_IMPORT = /from ['"]node:test['"]/;

/** Returns the tools specs that import `node:test`, as sorted `/` paths relative to `rootDir`. */
export function findNodeTestSpecs(rootDir: string = process.cwd()): string[] {
  return globSync(TOOLS_SPECS_GLOB, { cwd: rootDir })
    .filter((file) =>
      NODE_TEST_IMPORT.test(readFileSync(join(rootDir, file), 'utf8'))
    )
    .map(normalizeToolPath)
    .sort();
}

export function runNodeTestSpecs(
  nodeTestArgs: readonly string[],
  rootDir: string = process.cwd()
): number {
  const specs = findNodeTestSpecs(rootDir);
  if (specs.length === 0) {
    console.error(`No node:test specs match ${TOOLS_SPECS_GLOB}.`);
    return 1;
  }

  const result = spawnSync(
    process.execPath,
    ['--test', ...nodeTestArgs, ...specs],
    { cwd: rootDir, stdio: 'inherit' }
  );
  if (result.error) {
    console.error(result.error.message);
    return 1;
  }

  return result.status ?? 1;
}

if (isDirectEntrypoint(import.meta.url)) {
  process.exitCode = runNodeTestSpecs(process.argv.slice(2));
}
