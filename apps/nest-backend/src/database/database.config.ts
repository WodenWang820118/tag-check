import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { SequelizeOptions } from 'sequelize-typescript';
import { getDatabasePath } from '../configs/project.config';

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
  return {
    dialect: 'sqlite',
    storage: getDatabasePath(),
    autoLoadModels: true,
    synchronize: true,
  };
}

export const dataBaseConfig: SequelizeModuleOptions = getDatabaseConfig();
