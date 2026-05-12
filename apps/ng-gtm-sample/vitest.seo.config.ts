import { defineConfig } from 'vitest/config';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/ng-gtm-sample-seo',
  plugins: [nxViteTsPaths()],
  test: {
    name: 'ng-gtm-sample-seo',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['tests/seo/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default']
  }
});
