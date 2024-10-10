'use strict';
const { ChildProcess } = require('child_process');
const { app } = require('electron');
const { join } = require('path');
const constants = require('./main-process/constants.cjs');
const pathUtils = require('./main-process/path-utils.cjs');
const fileUtils = require('./main-process/file-utils.cjs');
const environmentUtils = require('./main-process/environment-utils.cjs');
const backend = require('./main-process/backend.cjs');
const database = require('./main-process/database.cjs');
const frontend = require('./main-process/frontend.cjs');
const { updateElectronApp } = require('update-electron-app');
updateElectronApp({
  updateInterval: '1 hour',
  logger: require('electron-log'),
}); // additional configuration options available

/**
 * @type {ChildProcess}
 */
let server;
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
    ),
    constants.ROOT_PROJECT_NAME
  );
  const db = database.getDatabase(process.resourcesPath);

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
        loadingWindow.close();
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
