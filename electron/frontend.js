const { BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');
const { getDevFrontendPath, getProductionFrontendPath } = require('./utils');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  if (isDev) {
    console.log('isDev', isDev);
    const devFrontendPath = getDevFrontendPath();
    mainWindow.loadFile(devFrontendPath);
    mainWindow.webContents.openDevTools(); // Open DevTools in development
  } else {
    try {
      const entryPath = getProductionFrontendPath();
      mainWindow.loadFile(entryPath);
      mainWindow.webContents.openDevTools(); // Open DevTools in development
    } catch (e) {
      console.error(e);
    }
  }
}

module.exports = { createWindow };
