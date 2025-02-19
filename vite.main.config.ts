import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      formats: ['es'], // output ES modules
      fileName: () => '[name].mjs'
    },
    rollupOptions: {
      external: ['sqlite3', ...builtinModules],
      output: {
        format: 'esm',
        entryFileNames: '[name].mjs'
      }
    }
  }
});
