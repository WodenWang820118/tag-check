/// <reference types="vitest" />

import angular from '@analogjs/vite-plugin-angular';

import tsconfigPaths from 'vite-tsconfig-paths';

import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    root: import.meta.dirname,
    plugins: [angular(), tsconfigPaths()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['**/*.spec.ts'],
      // Allow CI/pre-commit to pass when this package has no tests yet
      passWithNoTests: true,
      reporters: ['default'],
      coverage: {
        reportsDirectory: '../../coverage/libs/ui',
        provider: 'v8' as const,
        reporter: ['lcov']
      }
    },
    define: {
      'import.meta.vitest': mode !== 'production'
    }
  };
});
