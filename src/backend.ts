import { ChildProcess, fork } from 'child_process';
import { join } from 'path';
import * as pathUtils from './path-utils';
import * as fileUtils from './file-utils';
import * as environmentUtils from './environment-utils';
import * as constants from './constants';
import { BrowserWindow } from 'electron';

let restartAttempts = 0;
let maxRestartAttempts = 20;

function startBackend(resourcesPath: string) {
  let env;
  const rootBackendFolderPath = pathUtils.getRootBackendFolderPath(
    environmentUtils.getEnvironment(),
    resourcesPath
  );

  fileUtils.logToFile(
    rootBackendFolderPath,
    'Starting backend service...',
    'info'
  );

  const serverPath = join(rootBackendFolderPath, 'main.js');
  const commonEnv = {
    ROOT_PROJECT_PATH: join(rootBackendFolderPath, constants.ROOT_PROJECT_NAME),
    DATABASE_PATH: join(rootBackendFolderPath, constants.ROOT_DATABASE_NAME),
  };

  const devCommonEnv = {
    ROOT_PROJECT_PATH: join(
      rootBackendFolderPath,
      '..',
      '..',
      '..',
      constants.ROOT_PROJECT_NAME
    ),
    DATABASE_PATH: join(
      rootBackendFolderPath,
      '..',
      '..',
      '..',
      '.db',
      constants.ROOT_DATABASE_NAME
    ),
  };

  switch (environmentUtils.getEnvironment()) {
    case 'dev':
      env = {
        ...devCommonEnv,
        NODE_ENV: 'dev',
      };
      break;
    case 'staging':
      env = {
        ...devCommonEnv,
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

  fileUtils.logToFile(
    rootBackendFolderPath,
    `Starting backend with environment: ${JSON.stringify(env, null, 2)}`,
    'info'
  );

  fileUtils.logToFile(
    rootBackendFolderPath,
    `Starting backend with Server path: ${serverPath}`,
    'info'
  );
  // return utilityProcess.fork(serverPath, { env });
  return fork(serverPath, { env });
}

function restartBackend(resourcesPath: string) {
  if (restartAttempts < maxRestartAttempts) {
    restartAttempts++;
    console.log(`Attempting to restart backend (Attempt ${restartAttempts})`);
    setTimeout(() => {
      fileUtils.logToFile(
        join(
          pathUtils.getRootBackendFolderPath(
            environmentUtils.getEnvironment(),
            resourcesPath
          )
        ),
        'Ready to restart the backend.',
        'info'
      );
      startBackend(resourcesPath);
    }, 2000); // Wait for 2 seconds before restarting
  } else {
    console.error('Max restart attempts reached. Backend service is down.');
    // Here you might want to implement some notification mechanism
    // to alert the development team about the persistent issue
    fileUtils.logToFile(
      join(
        pathUtils.getRootBackendFolderPath(
          environmentUtils.getEnvironment(),
          resourcesPath
        )
      ),
      'Max restart attempts reached. Backend service is down.',
      'error'
    );
  }
}

function stopBackend(process: ChildProcess) {
  if (process) {
    process.kill();
  }
}

async function checkIfPortIsOpen(
  urls: string[],
  maxAttempts = 20,
  timeout = 1000,
  resourcesPath: string,
  loadingWindow: BrowserWindow
) {
  const logFilePath = join(
    pathUtils.getRootBackendFolderPath(
      environmentUtils.getEnvironment(),
      resourcesPath
    )
  );
  await new Promise((resolve) => setTimeout(resolve, 5000)); // await the backend to start
  fileUtils.logToFile(
    logFilePath,
    `Checking if ports are open: ${urls}`,
    'info'
  );
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    for (const url of urls) {
      try {
        fileUtils.logToFile(
          logFilePath,
          `Attempt ${attempt}: Checking port: ${url}`,
          'info'
        );
        const response = await fetch(url);

        console.log('Response status:', response.status);

        const responseData = await response.text();
        console.log('Response body:', responseData);

        fileUtils.logToFile(logFilePath, responseData, 'info');

        if (response.ok) {
          console.log('Server is ready');
          fileUtils.logToFile(
            logFilePath,
            `Server is ready: ${responseData}`,
            'info'
          );
          return true; // Port is open
        } else {
          console.log(`Server responded with status: ${response.status}`);
          fileUtils.logToFile(
            logFilePath,
            `Server responded with status: ${response.status}`,
            'warning'
          );
        }
      } catch (error) {
        console.error(`Attempt ${attempt}: Error connecting to server:`, error);
        fileUtils.logToFile(
          logFilePath,
          `Attempt ${attempt}: ${error.toString()}`,
          'error'
        );
      }
    }

    if (attempt < maxAttempts) {
      console.log(`Waiting ${timeout}ms before next attempt...`);
      await new Promise((resolve) => setTimeout(resolve, timeout));
    }
  }

  loadingWindow.close();
  throw new Error(
    `Failed to connect to the server after ${maxAttempts} attempts`
  );
}

export { startBackend, restartBackend, stopBackend, checkIfPortIsOpen };
