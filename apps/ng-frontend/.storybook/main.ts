import type { StorybookConfig } from '@storybook/angular';
import { StorybookConfigVite } from '@storybook/builder-vite';
import { UserConfig } from 'vite';

const config: StorybookConfig & StorybookConfigVite = {
  stories: ['../src/app/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/angular',
    options: {
      builder: {
        viteConfigPath: 'vite.config.mts'
      }
    }
  },
  async viteFinal(config: UserConfig) {
    // Merge custom configuration into the default config
    const { mergeConfig } = await import('vite');
    const { default: angular } = await import('@analogjs/vite-plugin-angular');

    return mergeConfig(config, {
      // Add dependencies to pre-optimization
      optimizeDeps: {
        include: [
          '@storybook/angular',
          '@storybook/angular/dist/client',
          '@angular/compiler',
          '@storybook/blocks',
          'tslib'
        ]
      },
      plugins: [angular({ jit: true, tsconfig: './.storybook/tsconfig.json' })],
      define: {
        STORYBOOK_ANGULAR_OPTIONS: JSON.stringify({
          experimentalZoneless: false
        })
      }
    });
  }
};

export default config;
