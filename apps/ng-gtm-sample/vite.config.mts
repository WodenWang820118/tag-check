/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/ng-gtm-sample',
  resolve: {
    tsconfigPaths: true
  },
  plugins: [angular(), nxCopyAssetsPlugin(['*.md'])],
  test: {
    name: 'ng-gtm-sample',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/ng-gtm-sample',
      provider: 'v8' as const,
      reporter: ['lcov', 'html']
    }
  }
}));
