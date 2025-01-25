import {
  HttpException,
  HttpStatus,
  INestApplication,
  Injectable,
  Logger
} from '@nestjs/common';
import { join } from 'path';
import { cwd } from 'process';

@Injectable()
export class ConfigsService {
  private USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36';
  private RECORDING_FOLDER = 'chrome_recordings';
  private RESULT_FOLDER = 'inspection_results';
  private CONFIG_FOLDER = 'config';
  private CONFIG_ROOT_PATH = 'rootProjectPath';
  private CONFIG_CURRENT_PROJECT_PATH = 'currentProjectPath';
  private ABSTRACT_REPORT_FILE_NAME = 'abstract.json';
  private SPECS = 'spec.json';
  private SETTINGS = 'settings.json';
  private META_DATA = 'project.json';
  private BROWSER_ARGS = [
    '--window-size=1440,900',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu'
  ];

  private DEFAULT_PROJECT_PATH = 'tag_check_projects';
  private DEFAULT_DATABASE_PATH = 'data.sqlite3';

  // the DATABASE_PATH and ROOT_PROJECT_PATH is set in the electron main process
  getDatabasePath(): string {
    const defaultDatabasePath = join(cwd(), '.db', this.DEFAULT_DATABASE_PATH);
    try {
      switch (process.env.NODE_ENV) {
        case 'dev':
        case 'staging':
          return defaultDatabasePath;
        case 'prod': {
          if (process.env.DATABASE_PATH) {
            return process.env.DATABASE_PATH;
          }
          return defaultDatabasePath;
        }
        case 'test':
          process.env.DATABASE_PATH = join(
            __dirname,
            '..',
            '..',
            '..',
            '..',
            '..',
            '.db',
            this.DEFAULT_DATABASE_PATH
          );

          Logger.log(process.env.DATABASE_PATH, 'DATABASE_PATH');
          return process.env.DATABASE_PATH;
        default: {
          return defaultDatabasePath;
        }
      }
    } catch (error) {
      Logger.error(error, 'Error getting the database path');
      throw new HttpException(
        'Error getting the database path',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  getRootProjectPath(): string {
    const defaultProjectPath = join(cwd(), this.DEFAULT_PROJECT_PATH);
    try {
      switch (process.env.NODE_ENV) {
        case 'dev':
        case 'staging':
          return defaultProjectPath;
        case 'test':
          process.env.ROOT_PROJECT_PATH = join(
            __dirname,
            '..',
            '..',
            '..',
            '..',
            '..',
            this.DEFAULT_PROJECT_PATH
          );
          Logger.log(process.env.ROOT_PROJECT_PATH, 'ROOT_PROJECT_PATH');
          return process.env.ROOT_PROJECT_PATH;
        case 'prod':
          if (process.env.ROOT_PROJECT_PATH && this.DEFAULT_PROJECT_PATH) {
            return join(
              process.env.ROOT_PROJECT_PATH,
              this.DEFAULT_PROJECT_PATH
            );
          }
          return defaultProjectPath;
        default: {
          if (process.env.ROOT_PROJECT_PATH && this.DEFAULT_PROJECT_PATH) {
            Logger.warn(
              `No NODE_ENV set. Defaulting to production database path: ${join(
                process.env.ROOT_PROJECT_PATH,
                this.DEFAULT_PROJECT_PATH
              )}`
            );
            return join(
              process.env.ROOT_PROJECT_PATH,
              this.DEFAULT_PROJECT_PATH
            );
          }
          return defaultProjectPath;
        }
      }
    } catch (error) {
      Logger.error(
        `Error getting the root project path: ${error}`,
        `${ConfigsService.name}.${ConfigsService.prototype.getRootProjectPath.name}`
      );
      throw new HttpException(
        'Error getting the root project path',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // TODO: configure port number effectively for both frontend and backend
  async activatePort(app: INestApplication<any>) {
    try {
      switch (process.env.NODE_ENV) {
        case 'dev':
          Logger.log('Listening on port 7070');
          await app.listen(process.env.PORT || 7070);
          break;
        case 'staging':
        case 'test':
          Logger.log('Listening on port 6060');
          await app.listen(process.env.PORT || 6060);
          break;
        case 'prod':
          Logger.log('Listening on port 7001');
          await app.listen(process.env.PORT || 7001);
          break;
        default:
          if (process.env.ROOT_PROJECT_PATH && this.DEFAULT_PROJECT_PATH) {
            Logger.warn(
              `No NODE_ENV set. Defaulting to production database path: ${join(
                process.env.ROOT_PROJECT_PATH,
                this.DEFAULT_PROJECT_PATH
              )}`
            );
            await app.listen(process.env.PORT || 7001);
            break;
          }
          break;
      }
    } catch (error) {
      Logger.error(
        error,
        `${ConfigsService.name}.${ConfigsService.prototype.activatePort.name}`
      );
      throw new HttpException(
        'the server is not activated',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  getUSER_AGENT(): string {
    return this.USER_AGENT;
  }

  getRECORDING_FOLDER(): string {
    return this.RECORDING_FOLDER;
  }

  getRESULT_FOLDER(): string {
    return this.RESULT_FOLDER;
  }

  getCONFIG_FOLDER(): string {
    return this.CONFIG_FOLDER;
  }

  getCONFIG_ROOT_PATH(): string {
    return this.CONFIG_ROOT_PATH;
  }

  getCONFIG_CURRENT_PROJECT_PATH(): string {
    return this.CONFIG_CURRENT_PROJECT_PATH;
  }

  getABSTRACT_REPORT_FILE_NAME(): string {
    return this.ABSTRACT_REPORT_FILE_NAME;
  }

  getSPECS(): string {
    return this.SPECS;
  }

  getSETTINGS(): string {
    return this.SETTINGS;
  }

  getMETA_DATA(): string {
    return this.META_DATA;
  }

  getBROWSER_ARGS(): string[] {
    return this.BROWSER_ARGS;
  }

  getDEFAULT_PROJECT_PATH(): string {
    return this.DEFAULT_PROJECT_PATH;
  }

  getDEFAULT_DATABASE_PATH(): string {
    return this.DEFAULT_DATABASE_PATH;
  }

  getDATABASE_PATH(): string {
    return this.getDatabasePath();
  }

  getROOT_PROJECT_PATH(): string {
    return this.getRootProjectPath();
  }
}
