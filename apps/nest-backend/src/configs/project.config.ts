/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import {
  HttpException,
  HttpStatus,
  INestApplication,
  Logger,
} from '@nestjs/common';
import { join } from 'path';
import { cwd } from 'process';

export const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36';
export const RECORDING_FOLDER = 'chrome_recordings';
export const RESULT_FOLDER = 'inspection_results';
export const CONFIG_FOLDER = 'config';
export const CONFIG_ROOT_PATH = 'rootProjectPath';
export const CONFIG_CURRENT_PROJECT_PATH = 'currentProjectPath';
export const ABSTRACT_REPORT_FILE_NAME = 'abstract.json';
export const SPECS = 'spec.json';
export const SETTINGS = 'settings.json';
export const META_DATA = 'project.json';
export const BROWSER_ARGS = [
  '--window-size=1440,900',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
];

const DEFAULT_PROJECT_PATH = 'tag_check_projects';
const DEFAULT_DATABASE_PATH = 'data.sqlite3';

// the DATABASE_PATH and ROOT_PROJECT_PATH is set in the electron main process

export function getDatabasePath(): string {
  let databasePath = join('..', '..', '..', '..', '.db', DEFAULT_DATABASE_PATH);
  try {
    switch (process.env.NODE_ENV) {
      case 'dev':
        return join(cwd(), '.db', DEFAULT_DATABASE_PATH);
      case 'staging':
        return join(cwd(), '.db', DEFAULT_DATABASE_PATH);
      case 'prod':
        return process.env.DATABASE_PATH || databasePath;
      case 'test':
        process.env.DATABASE_PATH = join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          '.db',
          DEFAULT_DATABASE_PATH
        );

        Logger.log(process.env.DATABASE_PATH, 'DATABASE_PATH');
        return process.env.DATABASE_PATH;
      default:
        Logger.warn(
          `No NODE_ENV set. Defaulting to production database path: ${join(
            process.env.DATABASE_PATH as string,
            '.db',
            DEFAULT_DATABASE_PATH
          )}`
        );
        databasePath = join(
          process.env.DATABASE_PATH as string,
          '.db',
          DEFAULT_DATABASE_PATH
        );
        return databasePath;
    }
  } catch (error) {
    Logger.error(error, 'Error getting the database path');
    Logger.error(`${databasePath}`, 'Database path');
    return join(cwd(), '.db', DEFAULT_DATABASE_PATH);
    // throw new HttpException(
    //   'Error getting the database path',
    //   HttpStatus.INTERNAL_SERVER_ERROR
    // );
  }
}

export function getRootProjectPath(): string {
  try {
    switch (process.env.NODE_ENV) {
      case 'dev':
        return join(cwd(), DEFAULT_PROJECT_PATH);
      case 'staging':
        return join(cwd(), DEFAULT_PROJECT_PATH);
      case 'test':
        process.env.ROOT_PROJECT_PATH = join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          DEFAULT_PROJECT_PATH
        );
        Logger.log(process.env.ROOT_PROJECT_PATH, 'ROOT_PROJECT_PATH');
        return process.env.ROOT_PROJECT_PATH;
      case 'prod':
        return join(
          process.env.ROOT_PROJECT_PATH as string,
          DEFAULT_PROJECT_PATH
        );
      default:
        Logger.warn(
          `No NODE_ENV set. Defaulting to production database path: ${join(
            process.env.ROOT_PROJECT_PATH as string,
            DEFAULT_PROJECT_PATH
          )}`
        );
        return join(
          process.env.ROOT_PROJECT_PATH as string,
          DEFAULT_PROJECT_PATH
        );
    }
  } catch (error) {
    Logger.error('Error getting the root project path', error);
    throw new HttpException(
      'Error getting the root project path',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// TODO: configure port number effectively for both frontend and backend
export async function activatePort(app: INestApplication<any>) {
  try {
    switch (process.env.NODE_ENV) {
      case 'dev':
        Logger.log('Listening on port 7070');
        await app.listen(process.env.PORT || 7070);
        break;
      case 'staging':
        Logger.log('Listening on port 6060');
        await app.listen(process.env.PORT || 6060);
        break;
      case 'test':
        Logger.log('Listening on port 6060');
        await app.listen(process.env.PORT || 6060);
        break;
      case 'prod':
        Logger.log('Listening on port 7001');
        await app.listen(process.env.PORT || 7001);
        break;
      default:
        Logger.warn(
          `No NODE_ENV set. Defaulting to production database path: ${join(
            process.env.ROOT_PROJECT_PATH as string,
            DEFAULT_PROJECT_PATH
          )}`
        );
        await app.listen(process.env.PORT || 7001);
        break;
    }
  } catch (error) {
    Logger.error('Error starting the server', error);
    throw new HttpException(
      'the server is not activated',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
