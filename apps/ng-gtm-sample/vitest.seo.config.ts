import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/ng-gtm-sample-seo',
  resolve: {
    tsconfigPaths: true
  },
  test: {
    name: 'ng-gtm-sample-seo',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['tests/seo/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default']
  }
});
