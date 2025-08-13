import { join } from 'path';
import electronLog from 'electron-log';
import * as environmentUtils from './environment-utils.js';
import * as pathUtils from './path-utils.js';
import log from 'electron-log/main.js';
log.initialize();

// For example, set a custom log file path based on your environment:
const logFilePath = join(
  pathUtils.getRootBackendFolderPath(
    environmentUtils.getEnvironment(),
    process.resourcesPath
  ),
  'logs',
  'main.log'
);

// Customize file transport: set the log file path and log level.
electronLog.transports.file.resolvePathFn = () => logFilePath;
electronLog.transports.file.level = 'info';

// Optionally override default console methods, so that they use electron-log.
Object.assign(console, electronLog.functions);

// Catch unhandled errors and rejected promises.
electronLog.errorHandler.startCatching();

// Optionally, if you want to log Electron events in the main process (uncomment when needed)
// import { app } from 'electron';
// app.on('will-quit', () => {
//   electronLog.info('App is about to quit');
// });

export default electronLog;
