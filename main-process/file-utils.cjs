'use strict';
const { existsSync, mkdirSync, appendFileSync } = require('fs');
const { join } = require('path');

function createProjectSavingRootFolder(folderPath) {
  if (!existsSync(folderPath)) {
    mkdirSync(folderPath, { recursive: true });
  }
}

function logToFile(path, message, type = 'info') {
  const logPath = join(path, `${type}.log`);
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${type.toUpperCase()}: ${message}\n`;

  try {
    appendFileSync(logPath, logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

function fileExists(filePath) {
  return existsSync(filePath);
}

module.exports = {
  createProjectSavingRootFolder,
  logToFile,
  fileExists,
};
