import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        'sqlite3',
        ...builtinModules,
      ],
    },
    commonjsOptions: {
      ignoreDynamicRequires: true,
    },
  },
});
