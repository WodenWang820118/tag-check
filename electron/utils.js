const path = require('path');
const fs = require('fs');
const { existsSync } = require('fs');

function getRootBackendFolderPath() {
  if (process.env.NODE_ENV === 'dev') {
    return '';
  } else if (process.env.NODE_ENV === 'staging') {
    return path.join(__dirname, 'dist', 'apps', 'nest-backend');
  } else {
    return process.resourcesPath;
  }
}

function getDataBasePath() {
  if (process.env.NODE_ENV === 'dev') {
    return path.join(getRootBackendFolderPath(), '.db', 'data.sqlite3');
  } else if (process.env.NODE_ENV === 'staging') {
    return path.join(getRootBackendFolderPath(), 'data.sqlite3');
  } else {
    return path.join(process.resourcesPath, 'data.sqlite3');
  }
}

function createProjectSavingRootFolder() {
  const rootFolder = path.join(
    getRootBackendFolderPath(),
    'tag_check_projects'
  );
  if (!existsSync(rootFolder)) {
    fs.mkdirSync(rootFolder);
  }
}

function getProjectSavingRootFolder() {
  return path.join(getRootBackendFolderPath(), 'tag_check_projects');
}

function getProductionFrontendPath() {
  const ngFrontendPath = path.join(
    process.resourcesPath,
    'ng-frontend',
    'browser',
    'index.html'
  );
  if (existsSync(ngFrontendPath)) {
    return ngFrontendPath;
  }
  return null;
}

function getDevFrontendPath() {
  const devFrontendPath = path.join(
    __dirname,
    'dist',
    'apps',
    'ng-frontend',
    'browser',
    'index.html'
  );

  switch (process.env.NODE_ENV) {
    case 'dev':
      return '';
    case 'staging':
      return devFrontendPath;
    default:
      throw new Error('Invalid NODE_ENV');
  }
}

module.exports = {
  getRootBackendFolderPath,
  getDataBasePath,
  createProjectSavingRootFolder,
  getProjectSavingRootFolder,
  getProductionFrontendPath,
  getDevFrontendPath,
};
