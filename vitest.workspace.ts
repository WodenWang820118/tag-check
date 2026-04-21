import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  '**/vitest.config.{js,ts}',
  '**/*.test.{js,ts,jsx,tsx}',
  'scripts/**/*.test.ts',
  'apps/*/vitest.config.ts',
  'libs/*/vitest.config.ts'
]);
