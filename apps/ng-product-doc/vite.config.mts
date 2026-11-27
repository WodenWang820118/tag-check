/// <reference types="vitest" />

import angular from '@analogjs/vite-plugin-angular';

import { defineConfig } from 'vite';
import { nxReadySignal } from '@nx/vite/plugins/nx-ready-signal.plugin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    root: import.meta.dirname,
    resolve: {
      tsconfigPaths: true
    },
    plugins: [angular(), nxReadySignal()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['**/*.spec.ts'],
      reporters: ['default'],
      coverage: {
        reportsDirectory: '../../coverage/apps/ng-product-doc',
        provider: 'v8' as const,
        reporter: ['lcov']
      }
    },
    define: {
      'import.meta.vitest': mode !== 'production'
    }
  };
});
