import { defineConfig } from 'vitest/config';

import {
  findNodeTestSpecs,
  TOOLS_SPECS_GLOB
} from './tools/scripts/testing/node-test-specs/node-test-specs.ts';

/**
 * Specs written for Node's built-in runner run with `node --test`
 * (`pnpm run test:tools:node`), not Vitest.
 */
const nodeTestSpecs = findNodeTestSpecs();

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
          include: [TOOLS_SPECS_GLOB],
          exclude: ['**/node_modules/**', ...nodeTestSpecs]
        }
      }
    ]
  }
});
