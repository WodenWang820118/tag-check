import type { StorybookConfig } from '@storybook/angular';

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
      // ngx-markdown lazily imports this optional peer for KaTeX support,
      // which the app does not use. esbuild skips the unresolved import, but
      // webpack fails the build, so resolve it to an empty module; ngx-markdown
      // then reports its own "include marked-katex-extension" error if KaTeX
      // is ever enabled.
      'marked-katex-extension': false
    };

    return webpackConfig;
  }
};

export default config;
