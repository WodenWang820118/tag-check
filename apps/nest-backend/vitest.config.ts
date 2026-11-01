import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const verboseTestLogs = process.env['TEST_LOGS'] === '1';
const isCi = process.env['CI'] === 'true';
const reporterConfig = resolveReporterConfig();

function resolveReporterConfig() {
  if (verboseTestLogs) {
    return { reporters: ['verbose'] as const };
  }
  if (isCi) {
    return { reporters: ['default'] as const };
  }
  return { reporters: ['dot'] as const };
}

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test-setup.ts'],
    include: ['**/*.{test,spec,e2e-spec}.?(c|m)[jt]s?(x)'],
    ...reporterConfig,
    testTimeout: 30000,
    // Chromium integration specs close the browser in afterAll. Under the
    // pre-commit run's parallel load that can exceed vitest's 10 s default
    // hook timeout (it failed there twice while passing alone), so hooks
    // get the same budget as tests.
    hookTimeout: 30000,
    coverage: {
      reportsDirectory: '../../coverage/apps/nest-backend',
      provider: 'v8',
      reporter: ['lcov']
    }
  },
  resolve: {
    tsconfigPaths: true
  },
  esbuild: {
    target: 'es2020'
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' }
    })
  ]
});
