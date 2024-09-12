'use strict';
const { fork } = require('child_process');
// const { utilityProcess } = require('electron');
const { join } = require('path');
const pathUtils = require('./path-utils.cjs');
const fileUtils = require('./file-utils.cjs');
const environmentUtils = require('./environment-utils.cjs');
const constants = require('./constants.cjs');

let restartAttempts = 0;
let maxRestartAttempts = 5;

function startBackend(existedEnv, resourcesPath) {
  let env;
  const rootBackendFolderPath = pathUtils.getRootBackendFolderPath(
    environmentUtils.getEnvironment(),
    resourcesPath
  );
  const serverPath = join(rootBackendFolderPath, 'main.js');
  const commonEnv = {
    ...existedEnv,
    ROOT_PROJECT_PATH: join(rootBackendFolderPath, constants.ROOT_PROJECT_NAME),
    DATABASE_PATH: join(rootBackendFolderPath, constants.ROOT_DATABASE_NAME),
  };

  switch (environmentUtils.getEnvironment()) {
    case 'dev':
      env = {
        ...commonEnv,
        NODE_ENV: 'dev',
        DATABASE_PATH: join(
          rootBackendFolderPath,
          '.db',
          constants.ROOT_DATABASE_NAME
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
  // return utilityProcess.fork(serverPath, { env });
  return fork(serverPath, { env });
}

function restartBackend(env, resourcesPath) {
  if (restartAttempts < maxRestartAttempts) {
    restartAttempts++;
    console.log(`Attempting to restart backend (Attempt ${restartAttempts})`);
    setTimeout(() => {
      fileUtils.writePath(
        join(
          pathUtils.getRootBackendFolderPath(
            environmentUtils.getEnvironment(),
            resourcesPath
          ),
          'restartLog.txt'
        ),
        'Ready to restart the backend.'
      );
      startBackend(env, resourcesPath);
    }, 1000); // Wait for 5 seconds before restarting
  } else {
    console.error('Max restart attempts reached. Backend service is down.');
    // Here you might want to implement some notification mechanism
    // to alert the development team about the persistent issue
    fileUtils.writePath(
      join(
        pathUtils.getRootBackendFolderPath(
          environmentUtils.getEnvironment(),
          resourcesPath
        ),
        'restartErrorLog.txt'
      ),
      'Max restart attempts reached. Backend service is down.'
    );
  }
}

function stopBackend(process) {
  if (process) {
    process.kill();
  }
}

async function checkIfPortIsOpen(
  urls,
  maxAttempts = 20,
  timeout = 2000,
  resourcesPath
) {
  console.log(
    `Attempting to check port with ${maxAttempts} attempts and ${timeout}ms timeout`
  );
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    for (const url of urls) {
      try {
        console.log(`Attempt ${attempt}: Trying to fetch ${url}`);
        const response = await fetch(url);
        console.log(
          `Attempt ${attempt}: Response from ${url}: ${response.status}`
        );
        if (response) {
          console.log('Server is ready');
          fileUtils.writePath(
            join(
              pathUtils.getRootBackendFolderPath(
                environmentUtils.getEnvironment(),
                resourcesPath
              ),
              'portLog.txt'
            ),
            `Response from ${url}: ${response.status}`
          );
          console.log(`Response from ${url}: ${response.status}`);
          return true; // Port is open
        }
      } catch (error) {
        console.log(
          `Attempt ${attempt}: Error fetching ${url}:`,
          error.message
        );
      }
    }
    console.log(
      `Attempt ${attempt}: Waiting for ${timeout}ms before retrying...`
    );
    await new Promise((resolve) => setTimeout(resolve, timeout));
  }
  console.log(`Failed to connect to the server after ${maxAttempts} attempts`);
  throw new Error(
    `Failed to connect to the server after ${maxAttempts} attempts`
  );
}

module.exports = {
  startBackend,
  restartBackend,
  stopBackend,
  checkIfPortIsOpen,
};
