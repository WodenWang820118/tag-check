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
