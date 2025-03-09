import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import { resolve } from 'path';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    outDir: '.vite/build',
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      formats: ['es'],
      fileName: () => 'main.mjs'
    },
    rollupOptions: {
      external: ['sqlite3', ...builtinModules, 'electron'],
      output: {
        format: 'es'
      }
    }
  },
  resolve: {
    // Ensure .mjs extensions are properly handled
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  }
});
