'use strict';
const { join } = require('path');
const constants = require('./constants.cjs');

function getRootBackendFolderPath(env, resourcesPath) {
  switch (env) {
    case 'dev':
    case 'staging':
      return join('dist', 'apps', 'nest-backend');
    case 'prod':
    default:
      return resourcesPath;
  }
}

function getDataBasePath(env, resourcesPath) {
  const rootPath = getRootBackendFolderPath(env, resourcesPath);
  return env === 'prod'
    ? join(resourcesPath, constants.ROOT_DATABASE_NAME)
    : join(rootPath, '.db', constants.ROOT_DATABASE_NAME);
}

function getProjectSavingRootFolder(env, resourcesPath) {
  return join(
    getRootBackendFolderPath(env, resourcesPath),
    constants.ROOT_PROJECT_NAME
  );
}

function getProductionFrontendPath(resourcesPath) {
  return join(resourcesPath, 'ng-frontend', 'browser', 'index.html');
}

function getDevFrontendPath() {
  return join('dist', 'apps', 'ng-frontend', 'browser', 'index.html');
}

module.exports = {
  getRootBackendFolderPath,
  getDataBasePath,
  getProjectSavingRootFolder,
  getProductionFrontendPath,
  getDevFrontendPath,
};
