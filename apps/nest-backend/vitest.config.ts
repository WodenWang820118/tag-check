import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

const verboseTestLogs = process.env['TEST_LOGS'] === '1';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test-setup.ts'],
    include: [
      '**/*.{test,spec,e2e-spec}.?(c|m)[jt]s?(x)',
      './test/**/*.e2e-spec.ts'
    ],
    reporters: verboseTestLogs ? ['verbose'] : ['dot'],
    testTimeout: 30000,
    coverage: {
      reportsDirectory: '../../coverage/apps/nest-backend',
      provider: 'v8',
      reporter: ['lcov']
    }
  },
  esbuild: {
    target: 'es2020'
  },
  plugins: [
    nxViteTsPaths(),
    swc.vite({
      module: { type: 'es6' }
    })
  ]
});
