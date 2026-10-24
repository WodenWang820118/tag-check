/// <reference types="vitest" />

import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    root: import.meta.dirname,
    plugins: [angular(), tsconfigPaths()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['**/*.spec.ts'],
      reporters: ['default'],
      coverage: {
        reportsDirectory: '../../coverage/apps/ng-tag-build',
        provider: 'v8' as const,
        reporter: ['lcov']
      }
    },
    define: {
      'import.meta.vitest': mode !== 'production'
    }
  };
});
