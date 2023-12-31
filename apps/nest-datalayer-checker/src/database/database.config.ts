import { SequelizeModuleOptions } from '@nestjs/sequelize';
import path from 'path';

export const dataBaseConfig: SequelizeModuleOptions = {
  dialect: 'sqlite',
  storage: path.join('.db/data.sqlite3'),
  autoLoadModels: true,
  synchronize: true,
};
