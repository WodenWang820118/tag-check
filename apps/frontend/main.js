const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
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
    mainWindow.loadFile(
      path.join(__dirname, '..', '..', 'dist', 'apps', 'frontend', 'index.html')
    ); // Load the bundled React app in production
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const startNestJsBackend = () => {
  const backend = spawn('node', [
    path.join(
      __dirname,
      '..',
      '..',
      'dist',
      'apps',
      'nest-datalayer-checker',
      'main.js'
    ),
  ]); // run the nestjs backend
  backend.stdout.on('data', (data) => {
    console.log(`NestJS: ${data}`);
  });

  backend.stderr.on('data', (data) => {
    console.error(`NestJS Error: ${data}`);
  });

  backend.on('close', (code) => {
    console.log(`NestJS backend exited with code ${code}`);
  });
};

app.on('ready', startNestJsBackend);
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
