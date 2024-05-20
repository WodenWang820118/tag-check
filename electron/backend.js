const { spawn } = require('child_process');
const path = require('path');
const { getRootBackendFolderPath } = require('./utils');

function startBackend() {
  let serverPath, env;

  if (process.env.NODE_ENV === 'dev') {
    serverPath = path.join(getRootBackendFolderPath(), 'main.js');
    env = {
      ...process.env,
      NODE_ENV: 'development',
      DATABASE_PATH: path.join(
        getRootBackendFolderPath(),
        '.db',
        'data.sqlite3'
      ),
    };
  } else if (process.env.NODE_ENV === 'staging') {
    serverPath = path.join(getRootBackendFolderPath(), 'main.js');
    env = {
      ...process.env,
      NODE_ENV: 'staging',
      ROOT_PROJECT_PATH: getRootBackendFolderPath(),
      DATABASE_PATH: path.join(getRootBackendFolderPath(), 'data.sqlite3'),
    };
  } else {
    serverPath = path.join(process.resourcesPath, 'main.js');
    env = {
      ...process.env,
      DATABASE_PATH: path.join(process.resourcesPath, 'data.sqlite3'),
    };
  }

  const serverProcess = spawn('node', [serverPath], { env });
  console.log(`Starting backend server at ${serverPath}`);
  serverProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

module.exports = { startBackend };
