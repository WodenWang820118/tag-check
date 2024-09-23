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
    reporters: ['verbose'],
    testTimeout: 120000,
    coverage: {
      enabled: true,
      reportsDirectory: '../../coverage/apps/nest-backend',
      provider: 'v8',
      reporter: ['lcov'],
    },
  },
  esbuild: {
    target: 'es2020',
  },
  plugins: [
    nxViteTsPaths(),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});
