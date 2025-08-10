/// <reference types="vitest" />

import angular from '@analogjs/vite-plugin-angular';

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    root: __dirname,
    plugins: [angular(), nxViteTsPaths()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['**/*.spec.ts'],
      // Allow CI/pre-commit to pass when this package has no tests yet
      passWithNoTests: true,
      reporters: ['default']
    },
    define: {
      'import.meta.vitest': mode !== 'production'
    }
  };
});
