import { join } from 'path';
import { cwd } from 'process';
import * as constants from './constants.js';

function getRootBackendFolderPath(env: any, resourcesPath: string) {
  switch (env) {
    case 'dev':
    case 'staging':
      return join(cwd(), 'dist', 'apps', 'nest-backend');
    case 'prod':
      return resourcesPath;
    default:
      return join(cwd(), 'dist', 'apps', 'nest-backend');
  }
}

function getDataBasePath(env: any, resourcesPath: string) {
  const rootPath = getRootBackendFolderPath(env, resourcesPath);
  return env === 'prod'
    ? join(resourcesPath, constants.ROOT_DATABASE_NAME)
    : join(
        '..',
        '..',
        '..',
        '..',
        rootPath,
        '.db',
        constants.ROOT_DATABASE_NAME
      );
}

function getProjectSavingRootFolder(env: any, resourcesPath: string) {
  switch (env) {
    case 'dev':
    case 'staging':
      return join(
        '..',
        '..',
        '..',
        '..',
        resourcesPath,
        constants.ROOT_PROJECT_NAME
      );
    case 'prod':
      return join(resourcesPath, constants.ROOT_PROJECT_NAME);
  }
}

function getProductionFrontendPath(resourcesPath: string) {
  return join(resourcesPath, 'ng-frontend', 'browser', 'index.html');
}

function getDevFrontendPath() {
  // return join('dist', 'apps', 'ng-frontend', 'browser', 'index.html');
  return join(cwd(), 'dist', 'apps', 'ng-frontend', 'browser', 'index.html');
}

export {
  getRootBackendFolderPath,
  getDataBasePath,
  getProjectSavingRootFolder,
  getProductionFrontendPath,
  getDevFrontendPath
};
