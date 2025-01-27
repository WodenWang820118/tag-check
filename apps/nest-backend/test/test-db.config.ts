// test-db.config.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import { TestResult } from '../src/shared/entity/test-file-report.entity';

export const testDbConfig: DataSourceOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: [TestResult], // Add all your entities here
  synchronize: true,
  dropSchema: true,
  logging: false
};

export const testDataSource = new DataSource(testDbConfig);
