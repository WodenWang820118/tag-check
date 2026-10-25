import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

// Mirror the Angular-friendly settings from vite.config.mts so TestBed is initialized.
export default defineConfig({
  resolve: {
    tsconfigPaths: true
  },
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      enabled: true,
      reportsDirectory: '../../coverage/libs/data-access',
      provider: 'v8',
      reporter: ['lcov']
    }
  }
});
