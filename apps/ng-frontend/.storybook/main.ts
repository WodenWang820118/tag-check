import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import type { StorybookConfig } from '@storybook/angular';

const require = createRequire(import.meta.url);
const storybookDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(storybookDir, '..', '..', '..');
const buildAngularDir = dirname(
  require.resolve('@angular-devkit/build-angular/package.json')
);
const babelHelperPath = require.resolve(
  '@babel/runtime/helpers/esm/asyncToGenerator',
  { paths: [buildAngularDir] }
);
const actualBabelRuntimeDir = dirname(dirname(dirname(babelHelperPath)));
const expectedBabelRuntimeDir = join(
  repoRoot,
  'node_modules',
  '@angular-devkit',
  'build-angular',
  'node_modules',
  '@babel',
  'runtime'
);
const normalizeWebpackPath = (path: string) => path.replaceAll('\\', '/');
const expectedAsyncToGeneratorPath = normalizeWebpackPath(
  join(expectedBabelRuntimeDir, 'helpers', 'esm', 'asyncToGenerator.js')
);

const config: StorybookConfig = {
  stories: ['../src/app/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/angular',
    options: {}
  },
  webpackFinal: async (webpackConfig) => {
    webpackConfig.resolve ??= {};
    webpackConfig.resolve.alias = {
      ...(webpackConfig.resolve.alias ?? {}),
      // Storybook resolves Babel helpers through a nested node_modules path
      // that pnpm does not materialize on disk.
      [normalizeWebpackPath(expectedBabelRuntimeDir)]: normalizeWebpackPath(
        actualBabelRuntimeDir
      ),
      [`${expectedAsyncToGeneratorPath}$`]:
        normalizeWebpackPath(babelHelperPath)
    };

    return webpackConfig;
  }
};

export default config;
