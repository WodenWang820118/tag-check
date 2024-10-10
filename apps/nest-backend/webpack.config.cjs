/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { composePlugins, withNx } = require('@nx/webpack');
// const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');

// Nx plugins for webpack.
module.exports = composePlugins(
  withNx({
    optimization: true,
    statsJson: true,
  }),
  (config) => {
    // Update the webpack config as needed here.
    // e.g. `config.plugins.push(new MyPlugin())`
    // Sentry plugin results in a build error regarding node-gyp failed to rebuild
    // config.devtool = 'source-map'; // Source map generation must be turned on
    // config.plugins.push(
    //   sentryWebpackPlugin({
    //     authToken: process.env.SENTRY_AUTH_TOKEN,
    //     org: 'guan-xin-wang',
    //     project: 'tag-check-nestjs',
    //   })
    // );
    return config;
  }
);
