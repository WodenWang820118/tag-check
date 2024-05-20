const { app, BrowserWindow } = require('electron');
const { getDatabase } = require('./database');
const {
  createProjectSavingRootFolder,
  getProjectSavingRootFolder,
} = require('./utils');
const { startBackend } = require('./backend');
const { createWindow } = require('./frontend');
const { v4: uuidv4 } = require('uuid');

('use strict');
if (require('electron-squirrel-startup')) app.quit();

app.whenReady().then(() => {
  createProjectSavingRootFolder();
  const db = getDatabase();
  db.serialize(() => {
    db.run(
      'CREATE TABLE IF NOT EXISTS configurations (\
        id TEXT PRIMARY KEY, \
        title TEXT, \
        description TEXT, \
        value TEXT, \
        createdAt DATE, \
        updatedAt DATE);'
    );

    const insertStmt = db.prepare(
      'INSERT OR REPLACE INTO configurations \
      (id, title, description, value, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?);'
    );
    insertStmt.run(
      uuidv4(),
      'rootProjectPath',
      'Root folder for projects',
      getProjectSavingRootFolder(),
      new Date(),
      new Date()
    );
    insertStmt.finalize();
  });
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
