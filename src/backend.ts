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
    DATABASE_PATH: join(rootBackendFolderPath, constants.ROOT_DATABASE_NAME)
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
    )
  };

  switch (environmentUtils.getEnvironment()) {
    case 'dev':
      env = {
        ...devCommonEnv,
        NODE_ENV: 'dev'
      };
      break;
    case 'staging':
      env = {
        ...devCommonEnv,
        NODE_ENV: 'staging'
      };
      break;
    case 'prod':
      env = {
        ...commonEnv,
        NODE_ENV: 'prod'
      };
      break;
    default:
      env = {
        ...commonEnv,
        NODE_ENV: 'prod'
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

  // Initialize logging
  fileUtils.logToFile(
    logFilePath,
    `Starting port check for: ${urls.join(', ')}`,
    'info'
  );

  // Create a function to check a single URL
  const checkUrl = async (url: string, attempt: number) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const responseData = await response.text();
        fileUtils.logToFile(
          logFilePath,
          `Connection successful to ${url}: ${responseData}`,
          'info'
        );
        return true;
      }
    } catch (error) {
      fileUtils.logToFile(
        logFilePath,
        `Attempt ${attempt} failed for ${url}: ${error.toString()}`,
        'error'
      );
      return false;
    }
    return false;
  };

  // Try all attempts
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Check all URLs concurrently
    const results = await Promise.all(
      urls.map((url) => checkUrl(url, attempt))
    );

    // If any URL check succeeded, return true
    if (results.some((result) => result === true)) {
      return true;
    }

    // Wait before next attempt
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, timeout));
    }
  }

  // Close loading window and throw error if all attempts failed
  loadingWindow.close();
  throw new Error(
    `Failed to connect to any server after ${maxAttempts} attempts`
  );
}

export { startBackend, restartBackend, stopBackend, checkIfPortIsOpen };
