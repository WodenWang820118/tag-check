import { globSync, readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const TOOLS_SPECS = 'tools/scripts/**/*.spec.ts';

/** Specs written for Node's built-in runner run with `node --test`, not Vitest. */
const nodeTestSpecs = globSync(TOOLS_SPECS)
  .filter((file) => /from ['"]node:test['"]/.test(readFileSync(file, 'utf8')))
  .map((file) => file.replaceAll('\\', '/'));

export default defineConfig({
  test: {
    // Vitest 4 projects must be config files, directories or inline configs;
    // test-file globs are rejected at startup.
    projects: [
      'apps/*/vitest.config.ts',
      'libs/*/vitest.config.ts',
      {
        test: {
          name: 'tools',
          environment: 'node',
          include: [TOOLS_SPECS],
          exclude: ['**/node_modules/**', ...nodeTestSpecs]
        }
      }
    ]
  }
});
