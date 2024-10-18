import { existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

function createProjectSavingRootFolder(folderPath: string) {
  if (!existsSync(folderPath)) {
    logToFile(folderPath, 'Creating project saving root folder...', 'info');
    mkdirSync(folderPath, { recursive: true });
  }
  logToFile(folderPath, 'Project saving root folder exists.', 'info');
}

function logToFile(path: string, message: string, type = 'info') {
  const logPath = join(path, `${type}.log`);
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${type.toUpperCase()}: ${message}\n`;

  try {
    appendFileSync(logPath, logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

function fileExists(filePath: string) {
  return existsSync(filePath);
}

export { createProjectSavingRootFolder, logToFile, fileExists };
