if (process.env.NODE_ENV === 'ng-frontend') {
  module.exports = {
    packagerConfig: {
      asar: true,
      extraResource: [
        './dist/apps/ng-frontend',
        './dist/apps/nest-backend/main.js',
      ],
    },
    rebuildConfig: {},
    makers: [
      {
        name: '@electron-forge/maker-squirrel',
        config: {
          certificateFile: './cert.pfx',
          certificatePassword: process.env.CERTIFICATE_PASSWORD,
        },
      },
      {
        name: '@electron-forge/maker-zip',
        platforms: ['win32'],
      },
      {
        name: '@electron-forge/maker-deb',
        config: {},
      },
      {
        name: '@electron-forge/maker-rpm',
        config: {},
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
}
