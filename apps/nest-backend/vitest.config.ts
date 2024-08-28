import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      '**/*.{test,spec,e2e-spec}.?(c|m)[jt]s?(x)',
      './test/**/*.e2e-spec.ts',
    ],
    reporters: ['default'],
    testTimeout: 120000,
  },
  plugins: [
    nxViteTsPaths(),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
