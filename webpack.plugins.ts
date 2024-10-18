import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
const webpack = require('webpack');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
  }),
  new webpack.DefinePlugin({
    'process.env.ROOT_PROJECT_PATH': JSON.stringify(
      process.env.ROOT_PROJECT_PATH
    ),
    'process.env.DATABASE_PATH': JSON.stringify(process.env.DATABASE_PATH),
    'process.env.PORT': JSON.stringify(process.env.PORT),
  }),
];
