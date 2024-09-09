'use strict';
const { BrowserWindow } = require('electron');
const pathUtils = require('./path-utils.cjs');
const { existsSync } = require('fs');
const { join } = require('path');

function createLoadingWindow() {
  try {
    const loadingWindow = new BrowserWindow({
      width: 400,
      height: 200,
      frame: false,
      // transparent: true,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
      },
    });

    loadingWindow.loadFile(join(__dirname, './loading.html'));
    loadingWindow.center();
    return loadingWindow;
  } catch (error) {
    console.error(error);
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
      mainWindow.webContents.openDevTools();
    }
  } catch (e) {
    console.error(e);
  }
}

module.exports = { createLoadingWindow, createWindow };
