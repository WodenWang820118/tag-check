import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import { resolve } from 'path';

export default process.env.NODE_ENV === 'dev'
  ? defineConfig({
      build: {
        outDir: '.', // Output to a dist folder at the root of your project
        rollupOptions: {
          external: ['sqlite3', ...builtinModules],
          output: {
            entryFileNames: 'main.js', // Output as main.js directly
            format: 'cjs' // Use CommonJS format for Node.js compatibility
          },
          input: {
            main: resolve(__dirname, 'src/main.ts') // Your main process entry file
          }
        },
        commonjsOptions: {
          ignoreDynamicRequires: true
        }
      }
    })
  : defineConfig({
      build: {
        rollupOptions: {
          external: ['sqlite3', ...builtinModules]
        },
        commonjsOptions: {
          ignoreDynamicRequires: true
        }
      }
    });
