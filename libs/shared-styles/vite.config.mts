/// <reference types='vitest' />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/libs/shared-styles',
  resolve: {
    tsconfigPaths: true
  },
  plugins: [angular()],
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    // Allow CI/pre-commit to pass when this package has no tests yet
    passWithNoTests: true,
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/libs/shared-styles',
      provider: 'v8',
      reporter: ['lcov']
    }
  }
});
