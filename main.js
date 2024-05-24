// electron
const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');
// child_process
const { spawn } = require('child_process');
// os module
const path = require('path');
const fs = require('fs');
const { existsSync } = require('fs');
// sqlite3 module
const sqlite3 = require('sqlite3').verbose();
// uuid module
const { v4: uuidv4 } = require('uuid');

('use strict');
if (require('electron-squirrel-startup')) app.quit();
const ROOT_PROJECT_NAME = 'tag_check_projects';
const ROOT_DATABASE_NAME = 'data.sqlite3';

// utils

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
  let serverPath, env, serverProcess;
  const rootBackendFolderPath = getRootBackendFolderPath();
  const commonEnv = {
    ...process.env,
    ROOT_PROJECT_PATH: path.join(rootBackendFolderPath, ROOT_PROJECT_NAME),
    DATABASE_PATH: path.join(rootBackendFolderPath, ROOT_DATABASE_NAME),
  };

  switch (process.env.NODE_ENV) {
    case 'dev':
      serverPath = path.join(rootBackendFolderPath, 'main.js');
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
      serverPath = path.join(rootBackendFolderPath, 'main.js');
      env = {
        ...commonEnv,
        NODE_ENV: 'staging',
      };
      break;
    case 'prod':
      serverPath = path.join(rootBackendFolderPath, 'main.js');
      env = {
        ...commonEnv,
        NODE_ENV: 'prod',
      };
      break;
    default:
      serverPath = path.join(rootBackendFolderPath, 'main.js');
      env = {
        ...commonEnv,
        NODE_ENV: 'prod',
      };
      break;
  }

  try {
    serverProcess = spawn('node', [serverPath], { env });

    writePath(path.join(rootBackendFolderPath, 'serverPath.txt'), serverPath);
    writePath(
      path.join(rootBackendFolderPath, 'serverEnv.txt'),
      JSON.stringify(env)
    );

    serverProcess.stdout.on('data', (data) => {
      if (data) {
        console.log(`Backend: ${data}`);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      if (data) {
        writePath(path.join(rootBackendFolderPath, 'serverErrorLog.txt'), data);
        console.error(`Backend Error: ${data}`);
      }
    });

    serverProcess.on('close', (code) => {
      writePath(
        path.join(rootBackendFolderPath, 'serverCloseLog.txt'),
        `Process exited with code ${code}`
      );
      console.log(`Backend process exited with code ${code}`);
    });
  } catch (error) {
    console.error(`Failed to start the backend process: ${error.message}`);
    writePath(
      path.join(rootBackendFolderPath, 'serverErrorLog.txt'),
      error.message
    );
  }
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

  if (isDev) {
    console.log('isDev', isDev);
    const devFrontendPath = getDevFrontendPath();
    mainWindow.loadFile(devFrontendPath);
    mainWindow.webContents.openDevTools(); // Open DevTools in development
  } else {
    try {
      const entryPath = getProductionFrontendPath();
      mainWindow.loadFile(entryPath);
      mainWindow.webContents.openDevTools(); // Open DevTools in development
    } catch (e) {
      console.error(e);
    }
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
  startBackend(); // method is called
  await new Promise((resolve) => setTimeout(resolve, 3000));
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
