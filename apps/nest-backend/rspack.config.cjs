const { join } = require('node:path');
const { NxAppRspackPlugin } = require('@nx/rspack/app-plugin');

// A standard rspack config, run by the inferred `@nx/rspack/plugin` targets
// (`rspack build` with this directory as the working directory). It builds
// the same bundle the `@nx/rspack:rspack` executor did:
// dist/apps/nest-backend/main.js plus the generated package.json and
// pnpm-lock.yaml that the desktop packaging installs from.
//
// Do not give the swc loader a `jsc.target` and keep `target: 'node'`
// without a version: the bundle must stay ES5. See AGENTS.md, "The
// nest-backend bundle targets ES5".

/**
 * NxAppRspackPlugin sets `node: false`. Put back the setting the old config
 * applied, so `__dirname` and `__filename` keep their Node.js values.
 * @type {import('@rspack/core').RspackPluginInstance}
 */
const nodeGlobalsPlugin = {
  apply(compiler) {
    compiler.options.node = {
      ...compiler.options.node,
      __dirname: false,
      __filename: false
    };
  }
};

/** @type {import('@rspack/core').Configuration} */
module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/nest-backend')
  },
  plugins: [
    new NxAppRspackPlugin({
      target: 'node',
      compiler: 'swc',
      main: './src/main.ts',
      // Absolute: the package.json generator reads this path relative to the
      // working directory, and a relative one silently drops `tslib`.
      tsConfig: join(__dirname, 'tsconfig.app.json'),
      outputPath: '../../dist/apps/nest-backend',
      outputFileName: 'main.js',
      outputHashing: 'none',
      externalDependencies: 'all',
      generatePackageJson: true,
      runtimeDependencies: ['sqlite3'],
      typeCheckOptions: false,
      // The executor never minified this bundle: the old config's
      // `withNx({ optimization: true, statsJson: true })` was skipped because
      // the executor had already applied withNx to the same config object.
      optimization: false,
      sourceMap: true
    }),
    nodeGlobalsPlugin
  ]
};
