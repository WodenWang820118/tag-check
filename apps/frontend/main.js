const isDev = require('electron-is-dev');
const path = require('path');
const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');

function startBackend() {
  const serverPath = isDev
    ? path.join(
        __dirname,
        '..',
        '..',
        'dist',
        'apps',
        'nest-datalayer-checker',
        'main.js'
      )
    : path.join(process.resourcesPath, 'main.js');

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

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:4200'); // Load your React app in development mode
    mainWindow.webContents.openDevTools(); // Open DevTools in development
  } else {
    // TODO: where is the real production index.html?
    // https://www.electronjs.org/docs/latest/tutorial/application-distribution
    try {
      const indexHtmlPath = path.join(
        process.resourcesPath,
        'frontend',
        'index.html'
      );
      mainWindow.webContents.openDevTools(); // Open DevTools in development
      mainWindow.loadFile(indexHtmlPath);
    } catch (e) {
      console.error(e);
    }
  }

  console.log('isDev', isDev);
  console.log('process.resourcesPath', process.resourcesPath);
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
