import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // Specify exact paths to your project configurations
  // Instead of using glob patterns that might catch .gitkeep files
  '**/vitest.config.{js,ts}',
  '**/*.test.{js,ts,jsx,tsx}',
  // Or specify exact directories that contain your test configurations
  'apps/*/vitest.config.ts',
  'libs/*/vitest.config.ts'
]);
