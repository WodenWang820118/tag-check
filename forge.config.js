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
        config: {},
      },
      {
        name: '@electron-forge/maker-zip',
        platforms: ['darwin'],
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
  };
}
