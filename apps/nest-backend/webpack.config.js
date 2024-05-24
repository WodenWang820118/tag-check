const { composePlugins, withNx } = require('@nx/webpack');
const path = require('path');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), (config) => {
  // Update the webpack config as needed here.
  // e.g. `config.plugins.push(new MyPlugin())`
  config.entry = './src/main.ts';
  config.output = {
    path: path.resolve(__dirname, '../../dist/apps/nest-backend'),
    filename: 'main.js',
  };
  config.resolve = {
    extensions: ['.ts', '.js'],
  };
  config.module = {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  };
  config.target = 'node';
  return config;
});
