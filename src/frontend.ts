import { BrowserWindow } from 'electron';
import { existsSync } from 'fs';
import { join } from 'path';
import * as pathUtils from './path-utils.js';
import log from './logger.js';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let loadingWindow: null | BrowserWindow = null;

function createLoadingWindow(resourcesPath: string) {
  log.info('Creating loading window');
  if (loadingWindow) {
    log.info('Loading window already exists');
    return loadingWindow;
  }

  try {
    loadingWindow = new BrowserWindow({
      width: 400,
      height: 200,
      frame: false,
      transparent: true,
      alwaysOnTop: true
    });
    log.info('Loading window created');
    log.info(
      'MAIN_WINDOW_VITE_DEV_SERVER_URL:',
      MAIN_WINDOW_VITE_DEV_SERVER_URL
    );

    // loading screen
    const productionUrl = join(resourcesPath, 'index.html');
    log.info('productionUrl:', productionUrl);
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      loadingWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      loadingWindow.loadFile(productionUrl);
    }

    loadingWindow.center();

    loadingWindow.on('closed', () => {
      loadingWindow = null;
    });

    return loadingWindow;
  } catch (error) {
    log.error('Error creating loading window:', error);
    return null;
  }
}

function createWindow(resourcesPath: string) {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  try {
    const entryPath = pathUtils.getProductionFrontendPath(resourcesPath);
    log.info(`Loading file: ${entryPath}`);
    if (!existsSync(entryPath)) {
      const devFrontendPath = pathUtils.getDevFrontendPath();
      mainWindow.loadFile(devFrontendPath);
      // mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
      mainWindow.webContents.openDevTools();
    } else {
      mainWindow.loadFile(entryPath);
    }
  } catch (e) {
    log.error('Error loading main window:', e);
  }
}

export { createLoadingWindow, createWindow };
