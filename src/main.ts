import { ChildProcess } from 'child_process';
import { app } from 'electron';
import { join } from 'path';
import * as constants from './constants';
import * as pathUtils from './path-utils';
import * as fileUtils from './file-utils';
import * as environmentUtils from './environment-utils';
import * as backend from './backend';
import * as frontend from './frontend';
// import { updateElectronApp } from 'update-electron-app';
import log from './logger';

// updateElectronApp({
//   updateInterval: '1 hour',
//   logger: log
// });

let server: ChildProcess;

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
  server = backend.startBackend(process.resourcesPath);

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
  await new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
  app.quit();
});
