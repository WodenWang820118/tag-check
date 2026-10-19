import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      '**/vitest.config.{js,ts}',
      '**/*.test.{js,ts,jsx,tsx}',
      'tools/scripts/**/*.spec.ts',
      'apps/*/vitest.config.ts',
      'libs/*/vitest.config.ts',
      '!vitest.config.ts'
    ]
  }
});
