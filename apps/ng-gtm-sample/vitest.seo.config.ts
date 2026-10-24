import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/ng-gtm-sample-seo',
  plugins: [tsconfigPaths()],
  test: {
    name: 'ng-gtm-sample-seo',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['tests/seo/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default']
  }
});
