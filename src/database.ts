import pkg from 'sqlite3';
import * as pathUtils from './path-utils';
import * as environmentUtils from './environment-utils';
import * as fileUtils from './file-utils';
import { v4 as uuidv4 } from 'uuid';

const { Database } = pkg;

function getDatabase(resourcesPath: string) {
  const logFilePath = pathUtils.getRootBackendFolderPath(
    environmentUtils.getEnvironment(),
    resourcesPath
  );
  const db = new Database(
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

async function initTables(db: any, resourcesPath: string) {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // Create table
        await db.run(`CREATE TABLE IF NOT EXISTS sys_configuration (
          id TEXT PRIMARY KEY,
          name TEXT,
          description TEXT,
          value TEXT,
          createdAt DATE,
          updatedAt DATE
        )`);

        const row = await db.get(
          'SELECT * FROM sys_configuration WHERE name = ?',
          ['rootProjectPath']
        );

        if (row) {
          await db.run(
            'UPDATE sys_configuration SET value = ?, updatedAt = ? WHERE id = ?',
            [
              pathUtils.getProjectSavingRootFolder(
                environmentUtils.getEnvironment(),
                resourcesPath
              ),
              new Date(),
              row.id
            ]
          );
        } else {
          await db.run(
            'INSERT INTO sys_configuration (id, name, description, value, createdAt, updatedAt) VALUES (?,?,?,?,?,?)',
            [
              uuidv4(),
              'rootProjectPath',
              'Root folder for projects',
              pathUtils.getProjectSavingRootFolder(
                environmentUtils.getEnvironment(),
                resourcesPath
              ),
              new Date(),
              new Date()
            ]
          );
        }
        resolve({});
      } catch (error) {
        reject(error);
      }
    });
  });
}

export { getDatabase, initTables };
