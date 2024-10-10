'use strict';
const sqlite3 = require('sqlite3').verbose();
const pathUtils = require('./path-utils.cjs');
const environmentUtils = require('./environment-utils.cjs');
const fileUtils = require('./file-utils.cjs');
const { v4: uuidv4 } = require('uuid');

function getDatabase(resourcesPath) {
  const logFilePath = pathUtils.getRootBackendFolderPath(
    environmentUtils.getEnvironment(),
    resourcesPath
  );
  const db = new sqlite3.Database(
    pathUtils.getDataBasePath(environmentUtils.getEnvironment(), resourcesPath),
    (err) => {
      if (err) {
        console.error(err.message);
        fileUtils.logToFile(logFilePath, err.message, 'error');
      }
      console.log('Connected to the database.');
      fileUtils.logToFile(logFilePath, 'Connected to the database.', 'info');
    }
  );
  return db;
}

function initTables(db, resourcesPath) {
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
        stmt.run(
          pathUtils.getProjectSavingRootFolder(
            environmentUtils.getEnvironment(),
            resourcesPath
          ),
          new Date(),
          configId
        );
      } else {
        stmt.run(
          uuidv4(),
          'rootProjectPath',
          'Root folder for projects',
          pathUtils.getProjectSavingRootFolder(
            environmentUtils.getEnvironment(),
            resourcesPath
          ),
          new Date(),
          new Date()
        );
      }

      stmt.finalize();
    });

    selectStmt.finalize();
  });
}

module.exports = {
  getDatabase,
  initTables,
};
