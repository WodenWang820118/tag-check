'use strict';
const { BrowserWindow, app } = require('electron');
const pathUtils = require('./path-utils.cjs');
const { existsSync } = require('fs');
const { join } = require('path');

let loadingWindow = null;

function createLoadingWindow() {
  if (loadingWindow) {
    console.log('Loading window already exists');
    return loadingWindow;
  }

  try {
    loadingWindow = new BrowserWindow({
      width: 400,
      height: 200,
      // frame: false,
      // transparent: true,
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
    return null;
  }
}

function createWindow(resourcesPath) {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  try {
    const entryPath = pathUtils.getProductionFrontendPath(resourcesPath);
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
