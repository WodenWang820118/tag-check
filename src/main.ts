import { ChildProcess } from 'child_process';
import { app } from 'electron';
import { join } from 'path';
import * as constants from './constants';
import * as pathUtils from './path-utils';
import * as fileUtils from './file-utils';
import * as environmentUtils from './environment-utils';
import * as backend from './backend';
import * as database from './database';
import * as frontend from './frontend';
import { updateElectronApp } from 'update-electron-app';
import { Database } from 'sqlite3';

updateElectronApp({
  updateInterval: '1 hour',
  logger: require('electron-log'),
}); // additional configuration options available

let server: ChildProcess;
let db: Database;
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('use-gl', 'desktop');

app.whenReady().then(() => {
  const logFilePath = join(
    pathUtils.getRootBackendFolderPath(
      environmentUtils.getEnvironment(),
      process.resourcesPath
    )
  );

  fileUtils.createProjectSavingRootFolder(
    pathUtils.getRootBackendFolderPath(
      environmentUtils.getEnvironment(),
      process.resourcesPath
    )
  );
  db = database.getDatabase(process.resourcesPath);

  database.initTables(db, process.resourcesPath);
  server = backend.startBackend(process.resourcesPath);
  const loadingWindow = frontend.createLoadingWindow();
  server.once('spawn', async () => {
    try {
      if (
        await backend.checkIfPortIsOpen(
          constants.URLs,
          20,
          2000,
          process.resourcesPath,
          loadingWindow
        )
      ) {
        loadingWindow?.close();
        frontend.createWindow(process.resourcesPath);
      }
    } catch (error) {
      console.error(error);
      fileUtils.logToFile(logFilePath, error.toString(), 'error');
    }
  });

  server.on('message', (message) => {
    console.log(`Message from child: ${message}`);
  });

  server.on('error', (error) => {
    fileUtils.logToFile(logFilePath, error.toString(), 'error');
    backend.stopBackend(server);
  });

  server.on('exit', (code, signal) => {
    console.log(`Child exited with code ${code} and signal ${signal}`);
    fileUtils.logToFile(
      logFilePath,
      `Child exited with code ${code} and signal ${signal}`,
      'info'
    );

    if (signal !== 'SIGTERM') backend.restartBackend(process.resourcesPath);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  // Perform any necessary cleanup here
  console.log('App is about to quit. Performing cleanup...');
  // Ensure all background processes are terminated
  if (server) {
    server.kill();
  }

  // Close any open connections
  db.close((err) => {
    if (err) {
      console.error('Error closing the database:', err.toString());
    } else {
      console.log('Database connection closed.');
    }
  });

  // Wait for all asynchronous operations to complete
  await new Promise((resolve) => {
    setTimeout(resolve, 1000); // Adjust the timeout as needed
  });

  // Quit the app
  app.quit();
});
