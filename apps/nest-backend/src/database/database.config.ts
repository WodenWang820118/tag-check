import { SequelizeModuleOptions } from '@nestjs/sequelize';
import path from 'path';

let storagePath: string;

console.log(process.env.NODE_ENV);

let isDevelopment = process.env.NODE_ENV === 'development';
let isProduction = process.env.NODE_ENV === 'production';

if (!isDevelopment && !isProduction) {
  console.log('In the Electron app.');
  isDevelopment = true;
  isProduction = false;
}

// use process.resourcesPath to get the path to the resources folder
// https://js.electronforge.io/interfaces/_electron_forge_shared_types.InternalOptions.Options.html#extraResource
if (isDevelopment) {
  storagePath = '.db/data.sqlite3';
} else {
  storagePath = path.join((process as any).resourcesPath, 'data.sqlite3');
}

console.log('storagePath', storagePath);

export const dataBaseConfig: SequelizeModuleOptions = {
  dialect: 'sqlite',
  storage: storagePath,
  autoLoadModels: true,
  synchronize: true,
};
