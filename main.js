'use strict';
// electron
const { app, BrowserWindow } = require('electron');
// child_process
const { fork } = require('child_process');
// os module
const path = require('path');
const fs = require('fs');
const { existsSync } = require('fs');
// sqlite3 module
const sqlite3 = require('sqlite3').verbose();
// uuid module
const { v4: uuidv4 } = require('uuid');

const ROOT_PROJECT_NAME = 'tag_check_projects';
const ROOT_DATABASE_NAME = 'data.sqlite3';

// utils
let server;
let restartAttempts = 0;
let maxRestartAttempts = 5;

function getRootBackendFolderPath() {
  switch (process.env.NODE_ENV) {
    case 'dev':
      return path.join('dist', 'apps', 'nest-backend');
    case 'staging':
      return path.join('dist', 'apps', 'nest-backend');
    case 'prod':
      return process.resourcesPath;
    default:
      // Default to production path
      return process.resourcesPath;
  }
}

function getDataBasePath() {
  switch (process.env.NODE_ENV) {
    case 'dev':
      return path.join(getRootBackendFolderPath(), '.db', ROOT_DATABASE_NAME);
    case 'staging':
      return path.join(getRootBackendFolderPath(), '.db', ROOT_DATABASE_NAME);
    case 'prod':
      return path.join(process.resourcesPath, ROOT_DATABASE_NAME);
    default:
      // Default to production path
      return path.join(process.resourcesPath, ROOT_DATABASE_NAME);
  }
}

function createProjectSavingRootFolder() {
  const rootFolder = path.join(getRootBackendFolderPath(), ROOT_PROJECT_NAME);
  if (!existsSync(rootFolder)) {
    fs.mkdirSync(rootFolder);
  }
}

function writePath(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function getProjectSavingRootFolder() {
  return path.join(getRootBackendFolderPath(), ROOT_PROJECT_NAME);
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
  return null;
}

function getDevFrontendPath() {
  const devFrontendPath = path.join(
    'dist',
    'apps',
    'ng-frontend',
    'browser',
    'index.html'
  );

  switch (process.env.NODE_ENV) {
    case 'dev':
      return devFrontendPath;
    case 'staging':
      return devFrontendPath;
    default:
      throw new Error('Invalid NODE_ENV');
  }
}

// backend

function startBackend() {
  let env;
  const rootBackendFolderPath = getRootBackendFolderPath();
  const serverPath = path.join(rootBackendFolderPath, 'main.js');
  const commonEnv = {
    ...process.env,
    ROOT_PROJECT_PATH: path.join(rootBackendFolderPath, ROOT_PROJECT_NAME),
    DATABASE_PATH: path.join(rootBackendFolderPath, ROOT_DATABASE_NAME),
  };

  switch (process.env.NODE_ENV) {
    case 'dev':
      env = {
        ...commonEnv,
        NODE_ENV: 'dev',
        DATABASE_PATH: path.join(
          rootBackendFolderPath,
          '.db',
          ROOT_DATABASE_NAME
        ),
      };
      break;
    case 'staging':
      env = {
        ...commonEnv,
        NODE_ENV: 'staging',
      };
      break;
    case 'prod':
      env = {
        ...commonEnv,
        NODE_ENV: 'prod',
      };
      break;
    default:
      env = {
        ...commonEnv,
        NODE_ENV: 'prod',
      };
      break;
  }
  return fork(serverPath, { env });
}

function restartBackend() {
  if (restartAttempts < maxRestartAttempts) {
    restartAttempts++;
    console.log(`Attempting to restart backend (Attempt ${restartAttempts})`);
    setTimeout(() => {
      writePath(
        path.join(getRootBackendFolderPath(), 'restartLog.txt'),
        'Ready to restart the backend.'
      );
      startBackend();
    }, 1000); // Wait for 5 seconds before restarting
  } else {
    console.error('Max restart attempts reached. Backend service is down.');
    // Here you might want to implement some notification mechanism
    // to alert the development team about the persistent issue
    writePath(
      path.join(getRootBackendFolderPath(), 'restartErrorLog.txt'),
      'Max restart attempts reached. Backend service is down.'
    );
  }
}

function stopBackend(process) {
  if (process) {
    process.kill();
  }
}

async function checkIfPortIsOpen(urls, maxAttempts = 20, timeout = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    for (const url of urls) {
      try {
        const response = await fetch(url);

        if (response) {
          console.log('Server is ready');
          writePath(
            path.join(getRootBackendFolderPath(), 'portLog.txt'),
            `Response from ${url}: ${response.status}`
          );
          console.log(`Response from ${url}: ${response.status}`);
          return true; // Port is open
        }
      } catch (error) {
        console.log(`Attempt ${attempt}: Waiting for server to start...`);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, timeout)); // Wait for 2 seconds before retrying
  }
  throw new Error(
    `Failed to connect to the server after ${maxAttempts} attempts`
  );
}

// database

function getDatabase() {
  const db = new sqlite3.Database(getDataBasePath(), (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the database.');
  });
  return db;
}

// electron

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  try {
    const entryPath = getProductionFrontendPath();
    if (!existsSync(entryPath)) {
      const devFrontendPath = getDevFrontendPath();
      mainWindow.loadFile(devFrontendPath);
      mainWindow.webContents.openDevTools();
    } else {
      mainWindow.loadFile(entryPath);
      mainWindow.webContents.openDevTools();
    }
  } catch (e) {
    console.error(e);
  }
}

// Electron app

app.whenReady().then(async () => {
  createProjectSavingRootFolder();
  const db = getDatabase();
  db.serialize(() => {
    // Create table statement remains unchanged
    db.run(
      'CREATE TABLE IF NOT EXISTS configurations (\
        id TEXT PRIMARY KEY, \
        title TEXT, \
        description TEXT, \
        value TEXT, \
        createdAt DATE, \
        updatedAt DATE);'
    );

    // Prepare a statement to select the rootProjectPath configuration
    const selectStmt = db.prepare(
      'SELECT * FROM configurations WHERE title =?;'
    );
    let configExists = false;
    let configId;

    selectStmt.get('rootProjectPath', (err, row) => {
      if (row) {
        configExists = true;
        configId = row.id;
      }

      // Depending on whether the configuration exists, prepare the appropriate SQL statement
      const sql = configExists
        ? 'UPDATE configurations SET value =?, updatedAt =? WHERE id =?;'
        : 'INSERT INTO configurations (id, title, description, value, createdAt, updatedAt) VALUES (?,?,?,?,?,?);';

      const stmt = db.prepare(sql);

      // Bind values appropriately
      if (configExists) {
        stmt.run(getProjectSavingRootFolder(), new Date(), configId);
      } else {
        stmt.run(
          uuidv4(),
          'rootProjectPath',
          'Root folder for projects',
          getProjectSavingRootFolder(),
          new Date(),
          new Date()
        );
      }

      stmt.finalize();
    });

    selectStmt.finalize();
  });

  server = startBackend();
  server.once('spawn', async () => {
    const urls = [
      'http://localhost:8080',
      'http://localhost:5000',
      'http://localhost:80',
    ];
    try {
      if (await checkIfPortIsOpen(urls, 20, 2000)) createWindow();
    } catch (error) {
      console.error(error);
      writePath(
        path.join(getRootBackendFolderPath(), 'portErrorLog.txt'),
        error
      );
    }
  });

  server.on('message', (message) => {
    console.log(`Message from child: ${message}`);
  });

  server.on('error', (error) => {
    writePath(
      path.join(getRootBackendFolderPath(), 'childErrorLog.txt'),
      error
    );
    stopBackend(server);
  });

  server.on('exit', (code, signal) => {
    console.log(`Child exited with code ${code} and signal ${signal}`);
    writePath(
      path.join(getRootBackendFolderPath(), 'childExitLog.txt'),
      `Child exited with code ${code} and signal ${signal}`
    );

    if (signal !== 'SIGTERM') restartBackend();
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
  const db = getDatabase();
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
