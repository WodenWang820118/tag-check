'use strict';
const { app } = require('electron');
const { join } = require('path');
const constants = require('./main-process/constants.cjs');
const pathUtils = require('./main-process/path-utils.cjs');
const fileUtils = require('./main-process/file-utils.cjs');
const environmentUtils = require('./main-process/environment-utils.cjs');
const backend = require('./main-process/backend.cjs');
const database = require('./main-process/database.cjs');
const frontend = require('./main-process/frontend.cjs');

let loadingWindow = null;
let server;

app.whenReady().then(() => {
  fileUtils.createProjectSavingRootFolder(
    pathUtils.getRootBackendFolderPath(
      environmentUtils.getEnvironment(),
      process.resourcesPath
    ),
    constants.ROOT_PROJECT_NAME
  );
  const db = database.getDatabase(process.resourcesPath);

  database.initTables(db, process.resourcesPath);
  server = backend.startBackend(process.env, process.resourcesPath);
  loadingWindow = frontend.createLoadingWindow();
  server.once('spawn', async () => {
    try {
      let portOpen = false;
      portOpen = await backend.checkIfPortIsOpen(
        constants.URLs,
        20,
        2000,
        process.resourcesPath
      );
      if (portOpen) {
        loadingWindow.close();
        frontend.createWindow(process.resourcesPath);
      }
    } catch (error) {
      console.error(error);
      fileUtils.writePath(
        join(
          pathUtils.getRootBackendFolderPath(
            environmentUtils.getEnvironment(),
            process.resourcesPath
          ),
          'portErrorLog.txt'
        ),
        error
      );
    }
  });

  server.on('message', (message) => {
    console.log(`Message from child: ${message}`);
  });

  server.on('error', (error) => {
    fileUtils.writePath(
      join(
        pathUtils.getRootBackendFolderPath(
          environmentUtils.getEnvironment(),
          process.resourcesPath
        ),
        'childErrorLog.txt'
      ),
      error
    );
    backend.stopBackend(server);
  });

  server.on('exit', (code, signal) => {
    console.log(`Child exited with code ${code} and signal ${signal}`);
    fileUtils.writePath(
      join(
        pathUtils.getRootBackendFolderPath(
          environmentUtils.getEnvironment(),
          process.resourcesPath
        ),
        'childExitLog.txt'
      ),
      `Child exited with code ${code} and signal ${signal}`
    );

    if (signal !== 'SIGTERM')
      backend.restartBackend(process.env, process.resourcesPath);
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
  const db = database.getDatabase(process.resourcesPath);
  db.close((err) => {
    if (err) {
      console.error('Error closing the database:', err.message);
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
