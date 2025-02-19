import { DataSource, DataSourceOptions } from 'typeorm';
import { entities } from './common';

export const testDbConfig: DataSourceOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: entities,
  synchronize: true,
  dropSchema: true,
  logging: false
};

export const testDataSource = new DataSource(testDbConfig);
