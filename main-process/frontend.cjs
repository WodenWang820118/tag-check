'use strict';
const { BrowserWindow } = require('electron');
const { existsSync } = require('fs');
const { join } = require('path');
const pathUtils = require('./path-utils.cjs');
const fileUtils = require('./file-utils.cjs');
const environmentUtils = require('./environment-utils.cjs');

let loadingWindow = null;
/**
 *
 * @returns {BrowserWindow}
 */
function createLoadingWindow() {
  console.log('Creating loading window');
  if (loadingWindow) {
    console.log('Loading window already exists');
    return loadingWindow;
  }

  try {
    loadingWindow = new BrowserWindow({
      width: 400,
      height: 200,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
      },
    });

    loadingWindow.loadFile(join(__dirname, 'loading.html'));
    loadingWindow.center();

    loadingWindow.on('closed', () => {
      loadingWindow = null;
    });

    return loadingWindow;
  } catch (error) {
    console.error('Error creating loading window:', error);
    fileUtils.logToFile(
      pathUtils.getRootBackendFolderPath(
        environmentUtils.getEnvironment(),
        process.resourcesPath
      ),
      error,
      'error'
    );
    return null;
  }
}

function createWindow(resourcesPath) {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  try {
    const entryPath = pathUtils.getProductionFrontendPath(resourcesPath);
    fileUtils.logToFile(
      pathUtils.getRootBackendFolderPath(
        environmentUtils.getEnvironment(),
        resourcesPath
      ),
      `Loading file: ${entryPath}`,
      'info'
    );
    if (!existsSync(entryPath)) {
      const devFrontendPath = pathUtils.getDevFrontendPath();
      mainWindow.loadFile(devFrontendPath);
      mainWindow.webContents.openDevTools();
    } else {
      mainWindow.loadFile(entryPath);
    }
  } catch (e) {
    console.error(e);
  }
}

module.exports = { createLoadingWindow, createWindow };
