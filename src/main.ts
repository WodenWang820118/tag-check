import { ChildProcess } from 'child_process';
import { app } from 'electron';
import { join } from 'path';
import * as constants from './constants.js';
import * as pathUtils from './path-utils.js';
import * as fileUtils from './file-utils.js';
import * as environmentUtils from './environment-utils.js';
import * as backend from './backend.js';
import * as frontend from './frontend.js';
import { updateElectronApp } from 'update-electron-app';
import { Database } from 'sqlite3';
import log from './logger.js';

updateElectronApp({
  updateInterval: '1 hour',
  logger: log
});

let server: ChildProcess;
let db: Database;

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('use-gl', 'desktop');

app.whenReady().then(async () => {
  const projectSavingFolder = join(
    pathUtils.getRootBackendFolderPath(
      environmentUtils.getEnvironment(),
      process.resourcesPath
    ),
    constants.ROOT_PROJECT_NAME
  );

  log.info(`Project Saving Folder: ${projectSavingFolder}`);

  fileUtils.createProjectSavingRootFolder(projectSavingFolder);

  const loadingWindow = frontend.createLoadingWindow(process.resourcesPath);
  server = backend.startBackend(process.resourcesPath, loadingWindow);

  server.once('spawn', async () => {
    try {
      if (await backend.checkIfPortIsOpen(loadingWindow)) {
        loadingWindow?.close();
        frontend.createWindow(process.resourcesPath);
      }
    } catch (error) {
      log.error('Error checking backend port:', error);
    }
  });

  server.on('message', (message) => {
    log.info(`Message from backend process: ${message}`);
  });

  server.on('error', (error) => {
    log.error('Backend encountered an error:', error);
    backend.stopBackend(server);
  });

  server.on('exit', (code, signal) => {
    log.info(`Backend exited with code ${code} and signal ${signal}`);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  log.info('App is about to quit. Performing cleanup...');
  if (server) {
    server.kill();
  }
  db.close((err) => {
    if (err) {
      log.error('Error closing the database:', err);
    } else {
      log.info('Database connection closed.');
    }
  });
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
  app.quit();
});
