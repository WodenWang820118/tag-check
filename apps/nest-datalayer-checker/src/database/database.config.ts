import { SequelizeModuleOptions } from '@nestjs/sequelize';
import path from 'path';

let storagePath: string;

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

if (!isDevelopment && !isProduction) {
  throw new Error('NODE_ENV is not set');
}

// use process.resourcesPath to get the path to the resources folder
// https://js.electronforge.io/interfaces/_electron_forge_shared_types.InternalOptions.Options.html#extraResource
if (isDevelopment) {
  storagePath = '.db/data.sqlite3';
} else if (isProduction) {
  storagePath = path.join((process as any).resourcesPath, 'data.sqlite3');
}

export const dataBaseConfig: SequelizeModuleOptions = {
  dialect: 'sqlite',
  storage: storagePath,
  autoLoadModels: true,
  synchronize: true,
};
