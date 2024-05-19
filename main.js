const isDev = require('electron-is-dev');
const path = require('path');
const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const { existsSync } = require('fs');

('use strict');
if (require('electron-squirrel-startup')) app.quit();

function startBackend() {
  let serverPath = path.join(process.resourcesPath, 'main.js');

  if (!existsSync(serverPath)) {
    serverPath = path.join(
      __dirname,
      'dist',
      'apps',
      'nest-backend',
      'main.js'
    );
  }

  if (!existsSync(serverPath)) {
    throw new Error('Backend server not found');
  }

  const serverProcess = spawn('node', [serverPath]);

  serverProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
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

  // Return null or throw an error if neither path exists
  return null;
}

function getDevFrontendPath(environment) {
  switch (environment) {
    case 'ng-frontend':
      return 'dist/apps/ng-frontend/browser/index.html';
    default:
      throw new Error('Invalid NODE_ENV');
  }
}

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
    const devFrontendPath = getDevFrontendPath(process.env.NODE_ENV);
    mainWindow.loadFile(devFrontendPath);
    mainWindow.webContents.openDevTools(); // Open DevTools in development
  } else {
    // https://www.electronjs.org/docs/latest/tutorial/application-distribution
    try {
      const entryPath = getProductionFrontendPath();
      mainWindow.loadFile(entryPath);
      mainWindow.webContents.openDevTools(); // Open DevTools in development
    } catch (e) {
      console.error(e);
    }
  }
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
