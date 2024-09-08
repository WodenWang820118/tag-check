'use strict';
const { existsSync, mkdirSync, writeFileSync } = require('fs');

function createProjectSavingRootFolder(folderPath) {
  if (!existsSync(folderPath)) {
    mkdirSync(folderPath, { recursive: true });
  }
}

function writePath(filePath, content) {
  writeFileSync(filePath, content, 'utf8');
}

function fileExists(filePath) {
  return existsSync(filePath);
}

module.exports = {
  createProjectSavingRootFolder,
  writePath,
  fileExists,
};
