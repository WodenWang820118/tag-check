import { ChildProcess, fork } from 'child_process';
import { join } from 'path';
import * as pathUtils from './path-utils';
import * as environmentUtils from './environment-utils';
import * as constants from './constants';
import { BrowserWindow } from 'electron';
import log from './logger';

function startBackend(
  resourcesPath: string,
  loadingWindow: BrowserWindow
): ChildProcess {
  let env;
  const envName = environmentUtils.getEnvironment();
  const rootBackendFolderPath = pathUtils.getRootBackendFolderPath(
    envName,
    resourcesPath
  );

  log.debug('Starting backend service...');

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

  const prodCommonEnv = {
    PORT: process.env.PORT || constants.DEFAULT_PORT,
    WEB_SOCKET: process.env.WEB_SOCKET || constants.DEFAULT_WEB_SOCKET
  };

  switch (envName) {
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
        NODE_ENV: 'prod',
        ...commonEnv,
        ...prodCommonEnv
      };
      break;
    default:
      env = {
        NODE_ENV: 'prod',
        ...commonEnv,
        ...prodCommonEnv
      };
      break;
  }

  log.info(
    `Starting backend with environment: ${JSON.stringify(env, null, 2)}`
  );
  log.info(`Starting backend with Server path: ${serverPath}`);

  // Fork the child process (the backend process)
  const child = fork(serverPath, { env });
  log.debug(`Forked backend process with PID: ${child.pid}`);

  child.on('error', (err) => {
    log.error(`Error in backend process: ${err}`);
  });

  // Optionally, listen for messages from the child process for further debugging info
  child.on('message', (msg) => {
    log.info(`Message from backend process: ${msg}`);
  });

  // Listen to exit event so that you can do graceful shutdown or auto-restart if needed
  child.on('exit', (code, signal) => {
    log.info(`Backend exited with code ${code} and signal ${signal}`);
  });

  return child;
}

function stopBackend(processInstance: ChildProcess): void {
  if (processInstance) {
    log.info('Stopping backend...');
    processInstance.kill();
  }
}

async function checkIfPortIsOpen(loadingWindow: BrowserWindow) {
  const maxAttempts = 30;
  const timeout = 2000;
  const urls = [...constants.URLs];
  log.info(`Starting port check for: ${urls.join(', ')}`);

  // Create a function to check a single URL
  const checkUrl = async (url: string, attempt: number): Promise<boolean> => {
    try {
      log.info(`Checking ${url} (Attempt ${attempt})...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(url, { signal: controller.signal });
      const responseData = await response.text();
      log.debug(`Raw response from ${url}: ${JSON.stringify(response)}`);
      log.debug(`Received response from ${url}: ${responseData}`);
      clearTimeout(timeoutId);
      if (JSON.parse(responseData).status === 'ok') {
        log.info(`Port check successful on ${url}`);
        return true;
      }
    } catch (error) {
      log.error(`Attempt ${attempt} failed for ${url}: ${error.toString()}`);
      return false;
    }
    return false;
  };

  // Try all attempts for the URLs
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const results = await Promise.all(
      urls.map((url) => checkUrl(url, attempt))
    );
    if (results.some((result) => result === true)) {
      log.info('Port check successful on at least one server');
      return true;
    }
    if (attempt < maxAttempts) {
      log.info(`Port check failed on all servers. Retrying in ${timeout}ms...`);
      await new Promise((resolve) => setTimeout(resolve, timeout));
    }
  }

  // If all attempts failed, close the loading window and throw an error
  loadingWindow.close();
  log.error(`Failed to connect to any server after ${maxAttempts} attempts.`);
  throw new Error(
    `Failed to connect to any server after ${maxAttempts} attempts`
  );
}

export { startBackend, stopBackend, checkIfPortIsOpen };
