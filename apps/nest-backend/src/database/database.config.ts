import { Logger } from '@nestjs/common';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { existsSync } from 'fs';
import { join } from 'path';
import { cwd } from 'process';
import { SequelizeOptions } from 'sequelize-typescript';

function getDatabaseConfig(): Partial<
  {
    name?: string;
    retryAttempts?: number;
    retryDelay?: number;
    autoLoadModels?: boolean;
    synchronize?: boolean;
    uri?: string;
  } & Partial<SequelizeOptions>
> {
  let storagePath: string;

  if (process.env.NODE_ENV === 'dev') {
    storagePath = join(cwd(), '.db', 'data.sqlite3');
  } else if (process.env.NODE_ENV === 'staging' || !process.env.NODE_ENV) {
    storagePath = process.env.DATABASE_PATH;
  }

  if (!existsSync(storagePath)) {
    Logger.log(
      `Database file not found at ${storagePath}. Creating a new one...`
    );
    storagePath = join(cwd(), '.db', 'data.sqlite3');
  }

  Logger.log(storagePath, 'Database file path:');

  return {
    dialect: 'sqlite',
    storage: storagePath,
    autoLoadModels: true,
    synchronize: true,
  };
}

export const dataBaseConfig: SequelizeModuleOptions = getDatabaseConfig();
