module.exports = {
  packagerConfig: {
    asar: true,
    extraResource: [
      './dist/apps/ng-frontend',
      './dist/apps/nest-backend/main.js',
      './dist/apps/nest-backend/node_modules',
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
  hooks: {
    postStart: async (forgeConfig, appProcess) => {
      console.log(`Spawned child pid: ${appProcess.pid}`);
    },
  },
};